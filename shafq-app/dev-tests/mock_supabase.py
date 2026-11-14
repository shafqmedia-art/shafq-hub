# خادم تجريبي محلي يحاكي Supabase (Auth + REST) فوق PostgreSQL حقيقي مع نفس schema.sql وصلاحيات RLS.
import json,re,subprocess,uuid,os,sys
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlparse,parse_qs
APP='/home/claude/shafq-app'; PORT=8770
USERS={}; ACCESS={}; REFRESH={}
IDENT=re.compile(r'^[a-z_][a-z0-9_]*$')
def psql(stmt,uid=None,vars=None):
    claims=json.dumps({'sub':uid}) if uid else ''
    role='authenticated' if uid else 'anon'
    script="begin;\nset local role %s;\n\\o /dev/null\nselect set_config('request.jwt.claims', :'claims', true);\n\\o\n%s;\ncommit;\n"%(role,stmt)
    cmd=['psql','-h','/tmp','-p','5544','-U','postgres','-d','shafq','-At','-q','-v','ON_ERROR_STOP=1','-v','claims='+claims]
    for k,v in (vars or {}).items(): cmd+=['-v','%s=%s'%(k,v)]
    r=subprocess.run(cmd+['-f','-'],input=script,capture_output=True,text=True)
    if r.returncode!=0:
        m=[l for l in r.stderr.splitlines() if 'ERROR' in l]; raise RuntimeError(m[0].split('ERROR:')[-1].strip() if m else r.stderr)
    return r.stdout.strip()
def admin(sql,vars=None):
    cmd=['psql','-h','/tmp','-p','5544','-U','postgres','-d','shafq','-At','-q','-v','ON_ERROR_STOP=1']
    for k,v in (vars or {}).items(): cmd+=['-v','%s=%s'%(k,v)]
    return subprocess.run(cmd+['-f','-'],input=sql,capture_output=True,text=True)
NOTES=[]
class H(BaseHTTPRequestHandler):
    def log_message(self,*a): pass
    def out(self,code,obj=None,ctype='application/json'):
        b=b'' if obj is None else (obj if isinstance(obj,bytes) else json.dumps(obj,ensure_ascii=False).encode())
        self.send_response(code); self.send_header('Content-Type',ctype); self.send_header('Content-Length',str(len(b))); self.send_header('Cache-Control','no-store'); self.end_headers(); self.wfile.write(b)
    def body(self):
        n=int(self.headers.get('Content-Length') or 0); return json.loads(self.rfile.read(n) or b'{}') if n else {}
    def uid(self):
        a=self.headers.get('Authorization','')
        if not a.startswith('Bearer '): return None
        t=a[7:]
        if t not in ACCESS: raise PermissionError('JWT expired')
        return ACCESS[t]
    def session(self,u):
        at='at-'+uuid.uuid4().hex; rt='rt-'+uuid.uuid4().hex; ACCESS[at]=u['id']; REFRESH[rt]=u['id']
        return {'access_token':at,'token_type':'bearer','expires_in':3600,'refresh_token':rt,'user':{'id':u['id'],'email':u['email']}}
    def handle_any(self):
        u=urlparse(self.path); q=parse_qs(u.query); path=u.path; m=self.command
        try:
            if path=='/__expire': ACCESS.clear(); return self.out(200,{})
            if path.startswith('/auth/v1/') or path.startswith('/rest/v1/'):
                if not self.headers.get('apikey'): return self.out(401,{'message':'No API key found in request'})
            if path=='/auth/v1/signup':
                b=self.body(); e=b.get('email','').lower(); p=b.get('password','')
                if not re.match(r'^[^@\s]+@[^@\s]+\.[a-z]{2,}$',e): return self.out(400,{'msg':'Email address "%s" is invalid'%e})
                if len(p)<6: return self.out(422,{'msg':'Password should be at least 6 characters'})
                if e in USERS: return self.out(422,{'msg':'User already registered'})
                usr={'id':str(uuid.uuid4()),'email':e,'password':p}; USERS[e]=usr
                admin("insert into auth.users(id,email) values (:'i',:'e');",{'i':usr['id'],'e':e}); return self.out(200,self.session(usr))
            if path=='/auth/v1/token':
                b=self.body(); g=q.get('grant_type',[''])[0]
                if g=='password':
                    usr=USERS.get(b.get('email','').lower())
                    if not usr or usr['password']!=b.get('password'): return self.out(400,{'error':'invalid_grant','error_description':'Invalid login credentials'})
                    return self.out(200,self.session(usr))
                if g=='refresh_token':
                    i=REFRESH.pop(b.get('refresh_token',''),None)
                    if not i: return self.out(400,{'error_description':'Invalid Refresh Token'})
                    return self.out(200,self.session([x for x in USERS.values() if x['id']==i][0]))
            if path=='/auth/v1/user' and m=='PUT':
                i=self.uid(); p=self.body().get('password','')
                if not i: return self.out(401,{'msg':'no session'})
                if len(p)<6: return self.out(422,{'msg':'Password should be at least 6 characters'})
                [x for x in USERS.values() if x['id']==i][0]['password']=p; return self.out(200,{'id':i})
            if path=='/auth/v1/logout': return self.out(204)
            if path=='/__notify': return self.out(200,NOTES)
            if path=='/functions/v1/push':
                bb=self.body()
                if bb.get('action')=='create_user':
                    i=self.uid(); role=psql("select role from public.profiles where id=:'i'",i,{'i':i}) if i else ''
                    if role!='manager': return self.out(403,{'status':403,'error':'مسموح للمدير بس'})
                    e=re.sub(r'\D','',bb.get('phone',''))+'@shafq.art'; pw=bb.get('pass','')
                    if len(pw)<8: return self.out(400,{'status':400,'error':'كلمة السر 8 أحرف على الأقل'})
                    if e in USERS: return self.out(409,{'status':409,'error':'هذا الرقم مسجل لحساب آخر'})
                    usr={'id':str(uuid.uuid4()),'email':e,'password':pw}; USERS[e]=usr
                    admin("insert into auth.users(id,email) values (:'i',:'e');",{'i':usr['id'],'e':e}); return self.out(200,{'status':200,'id':usr['id']})
                if bb.get('action')=='forgot': NOTES.append(bb); return self.out(200,{'status':200,'phone':'0952000000'})
                if not self.uid(): return self.out(401,{'msg':'no session'})
                NOTES.append(bb); return self.out(200,{'status':200,'sent':0})
                if not self.uid(): return self.out(401,{'msg':'no session'})
                NOTES.append(self.body()); return self.out(200,{'status':200,'sent':0})
            if path.startswith('/rest/v1/rpc/'):
                fn=path.split('/')[-1]; b=self.body(); i=self.uid()
                if fn=='has_manager': return self.out(200,json.loads(psql('select to_json(public.has_manager())',i)))
                if fn=='bootstrap_manager': psql("select public.bootstrap_manager(:'a', :'b')",i,{'a':b['p_name'],'b':b['p_phone']}); return self.out(204)
                if fn in ('save_push_sub','delete_push_sub','admin_set_password'):
                    keys=list(b.keys()); psql('select public.%s(%s)'%(fn,','.join(":'%s'"%k for k in keys)),i,b); return self.out(204)
                if fn=='client_portal': return self.out(200,json.loads(psql('select public.client_portal()',i)))
                return self.out(404,{'message':'no function'})
            if path.startswith('/rest/v1/'):
                t=path.split('/')[-1]; i=self.uid()
                if not IDENT.match(t): return self.out(400,{'message':'bad table'})
                if m=='GET':
                    order=(' order by t.id desc' if t=='audit_log' else ' order by t.created_at') if q.get('order') else ''
                    return self.out(200,json.loads(psql("select coalesce(json_agg(t%s),'[]') from public.%s t"%(order,t),i) or '[]'))
                flt=[(k,v[0]) for k,v in q.items() if v[0].startswith('eq.')]
                if m=='POST':
                    b=self.body(); cols=[c for c in b.keys()]
                    assert all(IDENT.match(c) for c in cols)
                    cl=','.join('"%s"'%c for c in cols); sql="insert into public.%s (%s) select %s from json_populate_record(null::public.%s, :'j')"%(t,cl,cl,t)
                    oc=q.get('on_conflict',[None])[0]
                    if oc and 'merge-duplicates' in self.headers.get('Prefer',''):
                        sql+=' on conflict ("%s") do update set %s'%(oc,','.join('"%s"=excluded."%s"'%(c,c) for c in cols if c!=oc))
                    psql(sql,i,{'j':json.dumps(b,ensure_ascii=False)}); return self.out(201)
                if m=='PATCH':
                    b=self.body(); cols=list(b.keys()); assert all(IDENT.match(c) for c in cols) and flt
                    k,v=flt[0]; sql='update public.%s t set %s from json_populate_record(null::public.%s, :\'j\') r where t."%s"::text = :\'v\''%(t,','.join('"%s"=r."%s"'%(c,c) for c in cols),t,k)
                    psql(sql,i,{'j':json.dumps(b,ensure_ascii=False),'v':v[3:]}); return self.out(204)
                if m=='DELETE':
                    k,v=flt[0]; psql('delete from public.%s where "%s"::text = :\'v\''%(t,k),i,{'v':v[3:]}); return self.out(204)
            # static
            if path=='/config.js': return self.out(200,('window.SHAFQ_CONFIG={mode:"server",serverUrl:"http://localhost:%d",serverKey:"test-key",countryCode:"963",pushKey:"BA5JlHUeMiqOGL2t9HKGrL05ytxKw5GShZVlVihSDsGEsCOz-Dy52kSpuJTbVbJeWEYWGZL5OcIYlri1nQtu7Ew",loginDomain:"shafq.art"};'%PORT).encode(),'application/javascript')
            f=os.path.normpath(os.path.join(APP,path.lstrip('/') or 'index.html'))
            if not f.startswith(APP) or not os.path.isfile(f): return self.out(404,b'not found','text/plain')
            ct={'html':'text/html; charset=utf-8','js':'application/javascript','css':'text/css','png':'image/png','webmanifest':'application/manifest+json'}.get(f.rsplit('.',1)[-1],'application/octet-stream')
            return self.out(200,open(f,'rb').read(),ct)
        except PermissionError as e: return self.out(401,{'message':str(e)})
        except RuntimeError as e:
            s=str(e); return self.out(403 if ('row-level security' in s or 'permission denied' in s) else 400,{'message':s})
    do_GET=do_POST=do_PATCH=do_PUT=do_DELETE=handle_any
ThreadingHTTPServer(('127.0.0.1',PORT),H).serve_forever()
