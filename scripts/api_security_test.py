# Uji keamanan & ACL API. Jalankan server (npm run dev, DEMO_MODE aktif, database baru) lalu: python3 scripts/api_security_test.py
# Atur target dengan env EAMS_URL (default http://localhost:3111). Butuh: pip install requests
import requests, json, re, sys
import os
HOST=os.environ.get('EAMS_URL','http://localhost:3111')
B=HOST+'/api/v1'
ok=0; bad=0
def check(name, cond, extra=''):
    global ok,bad
    if cond: ok+=1
    else: bad+=1; print('FAIL:',name,extra)
def call(m,p,tok=None,body=None,hdr=None):
    h={'Content-Type':'application/json'}
    if tok: h['Authorization']='Bearer '+tok
    if hdr: h.update(hdr)
    return requests.request(m,B+p,headers=h,data=json.dumps(body) if body is not None else None)
def login(email,pw='Demo@2026'):
    r=call('POST','/auth/login',body={'email':email,'password':pw}); return r

# --- unauthenticated
check('no token -> 401', call('GET','/customers').status_code==401)
check('spoof role header no token -> 401', call('GET','/auth/users',hdr={'x-user-role':'ADMIN_IT'}).status_code==401)
check('bad token -> 401', call('GET','/customers','abc.def').status_code==401)
check('login no password -> 400', call('POST','/auth/login',body={'email':'marcus@apex-industrial.com'}).status_code==400)
check('login unknown email -> 401 (no auto-register)', login('hacker@evil.com','x').status_code==401)
check('login wrong pw -> 401', login('marcus@apex-industrial.com','nope').status_code==401)
check('role param ignored', login('elena@apex-industrial.com').json()['user']['role']=='SALES_MARKETING')

admin=login('hendra.it@apex-industrial.com').json(); AT=admin['token']
users=call('GET','/auth/users',AT).json()['data']
check('users list ok', len(users)>=9)
check('no passwordHash leaked', all('passwordHash' not in u for u in users))
emails={u['role']:u['email'] for u in users}
toks={}
for role,em in emails.items():
    r=login(em); check('login '+role, r.status_code==200, r.text)
    if r.status_code==200: toks[role]=r.json()['token']
print('roles seeded:', sorted(toks))

# tamper token
t=toks['SALES_MARKETING']; body,sig=t.split('.')
import base64
pl=json.loads(base64.urlsafe_b64decode(body+'=='))
pl['uid']=[u['id'] for u in users if u['role']=='ADMIN_IT'][0]
nb=base64.urlsafe_b64encode(json.dumps(pl).encode()).decode().rstrip('=')
check('tampered token rejected', call('GET','/auth/users',nb+'.'+sig).status_code==401)

# --- role matrix
E=lambda role,m,p,b=None: call(m,p,toks[role],b).status_code
check('OPERATOR cannot read invoices', E('OPERATOR_USER','GET','/invoices')==403)
check('OPERATOR cannot read customers', E('OPERATOR_USER','GET','/customers')==403)
check('OPERATOR can read assets', E('OPERATOR_USER','GET','/assets')==200)
check('OPERATOR can lookup barcode', E('OPERATOR_USER','GET','/assets/barcode/AST-10024')==200)
check('SALES cannot list users', E('SALES_MARKETING','GET','/auth/users')==403)
check('SALES cannot create user', E('SALES_MARKETING','POST','/auth/users',{'name':'x','email':'x@y.com','role':'ADMIN_IT'})==403)
check('SALES cannot read invoices', E('SALES_MARKETING','GET','/invoices')==403)
check('SALES can read customers', E('SALES_MARKETING','GET','/customers')==200)
check('PROCUREMENT cannot create payment', E('PROCUREMENT','POST','/payments',{})==403)
check('PROCUREMENT cannot read customers', E('PROCUREMENT','GET','/customers')==403)
check('PROCUREMENT can read vendors', E('PROCUREMENT','GET','/procurement/vendors')==200)
check('FAT can read invoices', E('FINANCE_ACCOUNTING_TAX','GET','/invoices')==200)
check('FAT cannot touch procurement POs', E('FINANCE_ACCOUNTING_TAX','POST','/procurement/purchase-orders',{})==403)
check('EXEC cannot PATCH settings', E('EXECUTIVE','PATCH','/settings',{'companyName':'x'})==403)
check('EXEC cannot backup', E('EXECUTIVE','GET','/system/backup')==403)
check('EXEC cannot reset demo', E('EXECUTIVE','POST','/system/reset-demo')==403)
check('EXEC cannot restore', E('EXECUTIVE','POST','/system/restore',{})==403)
check('EXEC cannot openapi', E('EXECUTIVE','GET','/openapi.json')==403)
check('TECH can scan-start path (not 403)', E('TECHNICAL_SERVICE','POST','/technical-service/scan-start',{})!=403)
check('SALES cannot scan-start', E('SALES_MARKETING','POST','/technical-service/scan-start',{})==403)
check('settings GET ok for all', E('OPERATOR_USER','GET','/settings')==200)
check('role header spoof ignored', call('GET','/auth/users',toks['SALES_MARKETING'],hdr={'x-user-role':'ADMIN_IT'}).status_code==403)
check('unknown endpoint denied', call('GET','/nonexistent',AT).status_code==403)
check('unknown /api path -> 404 json', requests.get(HOST+'/api/zzz').status_code==404)

# admin reaches every GET endpoint (ACL coverage)
src=open('server/routes.ts').read()
gets=re.findall(r"apiRouter\.get\('([^']+)'",src)
for g in gets:
    p=re.sub(r':\w+','X',g)
    if p in ('/system/backup',): continue
    r=call('GET',p,AT)
    check('admin GET '+g+' not ACL-blocked', r.status_code!=403, r.text[:80])

# --- backup has no hashes
bk=call('GET','/system/backup',AT)
check('backup ok & no hashes', bk.status_code==200 and 'passwordHash' not in bk.text and 'scrypt$' not in bk.text)

# --- user admin flows
r=call('POST','/auth/users',AT,{'name':'Tester Baru','email':'tester@apex-industrial.com','role':'SALES_MARKETING','permissions':{'canManageUsers':True}})
check('create user 201', r.status_code==201, r.text)
nu=r.json(); tmp=nu.get('temporaryPassword')
check('temp password returned, no hash', tmp and 'passwordHash' not in nu)
check('dup email rejected', call('POST','/auth/users',AT,{'name':'a','email':'tester@apex-industrial.com','role':'SALES_MARKETING'}).status_code==400)
check('bad role rejected', call('POST','/auth/users',AT,{'name':'a','email':'zz@apex-industrial.com','role':'GOD'}).status_code==400)
lr=login('tester@apex-industrial.com',tmp); check('new user login', lr.status_code==200)
nt=lr.json()['token']; check('mustChangePassword flag', lr.json()['user']['mustChangePassword'] is True)
check('blocked until pw change', call('GET','/customers',nt).status_code==403 and call('GET','/customers',nt).json().get('code')=='PASSWORD_CHANGE_REQUIRED')
check('weak new pw rejected', call('POST','/auth/change-password',nt,{'currentPassword':tmp,'newPassword':'abc'}).status_code==400)
cp=call('POST','/auth/change-password',nt,{'currentPassword':tmp,'newPassword':'Rahasia2026x'})
check('change pw ok', cp.status_code==200, cp.text)
nt2=cp.json()['token']
check('old token dead after pw change', call('GET','/auth/me',nt).status_code==401)
check('new token works', call('GET','/customers',nt2).status_code==200)
# override canManageUsers (delta true) granted?
me=call('GET','/auth/me',nt2).json()
check('permission delta grants user-management', 'user-management' in me['modules'], str(me['modules']))
check('...and server enforces it', call('GET','/auth/users',nt2).status_code==200)
# revoke via admin
uid=nu['id']
check('admin revokes perm', call('PUT','/auth/users/'+uid,AT,{'permissions':{'canManageUsers':False}}).status_code==200)
check('revoked immediately', call('GET','/auth/users',nt2).status_code==403)
# suspend kills session
check('suspend', call('PUT','/auth/users/'+uid,AT,{'status':'SUSPENDED'}).status_code==200)
check('suspended token dead', call('GET','/customers',nt2).status_code==401)
check('suspended cannot login', login('tester@apex-industrial.com','Rahasia2026x').status_code==403)
# mass assignment
r=call('PUT','/auth/users/'+uid,AT,{'passwordHash':'x','id':'HACK','email':'e@e.com','status':'ACTIVE'})
check('mass-assign ignored', r.status_code==200 and r.json()['id']==uid and r.json()['email']=='tester@apex-industrial.com')
# reset password really works
rp=call('POST','/auth/users/'+uid+'/reset-password',AT,{'forcePasswordChange':False}); tp=rp.json()['temporaryPassword']
check('login with reset pw', login('tester@apex-industrial.com',tp).status_code==200)
check('old pw no longer works', login('tester@apex-industrial.com','Rahasia2026x').status_code==401)
# self-protection / last admin
aid=[u['id'] for u in users if u['role']=='ADMIN_IT'][0]
check('admin cannot demote self', call('PUT','/auth/users/'+aid,AT,{'role':'SALES_MARKETING'}).status_code==400)
check('admin cannot deactivate self', call('DELETE','/auth/users/'+aid,AT).status_code==400)
# persistence: users survive (checked after restart separately)

# lockout
for i in range(5): login('reza.ar@apex-industrial.com','bad')
check('lockout 429', login('reza.ar@apex-industrial.com','Demo@2026').status_code==429)

# notifications filtered by role
n_admin=call('GET','/notifications',AT).json()['total']; n_op=call('GET','/notifications',toks['OPERATOR_USER']).json()['total']
print('notifs admin/operator:',n_admin,n_op)
# audit attribution
logs=call('GET','/audit-logs',AT).json()['data']
check('audit has real actor id', any(l['action']=='USER_CREATED' and l['userId']==aid for l in logs))
print(f'\nPASS {ok}  FAIL {bad}')
