import asyncio,sys,subprocess
from playwright.async_api import async_playwright
B=sys.argv[1]; SERVER=len(sys.argv)>2; R=[]
def ok(n,c,e=''): R.append((n,bool(c),str(e)))
def sql(q): return subprocess.run(['psql','-h','/tmp','-p','5544','-U','postgres','-d','shafq','-At','-c',q],capture_output=True,text=True).stdout.strip()
W=900 if SERVER else 300
async def fm(page,vals):
    for k,v in vals.items():
        el=page.locator(f'#m_{k}')
        if await el.evaluate('e=>e.tagName')=='SELECT': await el.select_option(v)
        else: await el.fill(v)
    await page.locator('#modal button[type=submit]').click(); await page.wait_for_timeout(W)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        c=await b.new_context(viewport={'width':1440,'height':1000},service_workers='block'); pg=await c.new_page(); errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('dialog',lambda d:asyncio.ensure_future(d.accept()))
        async def go(r): await pg.goto(B+r); await pg.wait_for_timeout(W)
        await go(''); await pg.wait_for_timeout(600)
        await pg.fill('#s_name','عبد الرحمن'); await pg.fill('#s_phone','0952000000'); await pg.fill('#s_pass','secret12'); await pg.click('form[data-form=setup] button'); await pg.wait_for_timeout(2500 if SERVER else 600)
        await go('#/clients'); await pg.click('[data-act=addClient]'); await fm(pg,{'name':'الخباز','value':'650','months':'3'})
        cid=await pg.evaluate('SHAFQ.db().clients[0].id')
        # projects + linked money
        await go('#/m/projects'); await pg.click('[data-act=addItem]'); await fm(pg,{'name':'مؤتمر تجريبي','type':'مؤتمر','client_id':cid,'price':'500'})
        pid=await pg.evaluate('SHAFQ.db().items[0].id')
        await go('#/finance'); await pg.click('.acts [data-act=addMove]'); await fm(pg,{'amount':'250','item_id':pid})
        await pg.click('.acts [data-act=addMove]'); await fm(pg,{'dir':'out','cat':'مواصلات','amount':'60','item_id':pid})
        await go('#/m/projects'); await pg.locator('details.tile > summary').first.click()
        t=await pg.locator('details.tile').first.inner_text()
        ok('project money: received 250, left 250, costs 60, profit 190',all(x in t for x in ['$500','$250','$60','$190']),t.replace('\n',' | ')[:300])
        await pg.locator('select[data-chg=istatus]').first.select_option('مونتاج'); await pg.wait_for_timeout(W)
        ok('project status change',await pg.evaluate('SHAFQ.db().items[0].status')=='مونتاج')
        # drone
        await go('#/m/drone'); await pg.click('[data-act=addItem]'); await fm(pg,{'name':'عميل درون','phone':'0933333333','pack':'فيديو قصير','area':'المزة','permit':'بانتظار الموافقة','price':'50'})
        await pg.evaluate('(()=>{const d=SHAFQ.db(); const x=d.items.find(i=>i.kind==="drone"); const t=new Date(); x.date=t.getFullYear()+"-"+String(t.getMonth()+1).padStart(2,"0")+"-"+String(t.getDate()).padStart(2,"0"); document.querySelector("[data-act=theme]").click(); document.querySelector("[data-act=theme]").click();})()'); await pg.wait_for_timeout(W)
        await go('#/m/drone'); kp=await pg.locator('.kpi b').all_inner_texts(); ok('drone KPIs',kp[0]=='1' and kp[1]=='1' and kp[2]=='1',kp)
        # content board
        await go('#/m/content'); await pg.click('[data-act=addItem]'); await fm(pg,{'name':'ريل الافتتاح','client_id':cid,'type':'ريل'})
        ok('content board has 6 columns',await pg.locator('.board .col').count()==6)
        await pg.locator('.card select[data-chg=istatus]').first.select_option('موافقة العميل'); await pg.wait_for_timeout(W)
        ok('post moved to client approval column','ريل الافتتاح' in await pg.locator('.board .col').nth(3).inner_text())
        # talent + tags
        await go('#/m/talent'); await pg.click('[data-act=addItem]'); await fm(pg,{'name':'فريلانسر أول','account':'@test.films','skills':'فيلم ميكر، مونتير','phone':'0944444444'})
        await pg.click('[data-act=addItem]'); await fm(pg,{'name':'فريلانسر ثاني','skills':'مصور'})
        await pg.locator('[data-act=mtag][data-v="مصور"]').click(); await pg.wait_for_timeout(200)
        ok('talent filter by skill',await pg.locator('details.tile').count()==1 and 'فريلانسر ثاني' in await pg.locator('details.tile').first.inner_text())
        await pg.locator('[data-act=mtag][data-v=""]').click()
        await pg.locator('details.tile > summary').first.click(); hrefs=await pg.locator('details.tile').first.locator('a').evaluate_all('a=>a.map(x=>x.href)')
        ok('talent links: instagram + whatsapp 963',any('instagram.com/test.films' in x for x in hrefs) and any('wa.me/963944444444' in x for x in hrefs),hrefs)
        # influencers
        await go('#/m/influencers'); await pg.click('[data-act=addItem]'); await fm(pg,{'name':'مؤثر','niches':'أزياء وخياطة، لايف ستايل','followers':'15000'})
        ok('influencer saved',await pg.evaluate('SHAFQ.db().items.filter(i=>i.kind==="influencer").length')==1)
        # leads → client
        await go('#/m/leads'); await pg.click('[data-act=addItem]'); await fm(pg,{'name':'مطعم تجريبي','activity':'مطعم','value':'400'})
        await pg.click('[data-act=lead2client]'); await pg.wait_for_timeout(W)
        ok('lead converted to client',await pg.evaluate('SHAFQ.db().clients.length')==2 and await pg.evaluate('SHAFQ.db().items.find(i=>i.kind==="lead").status')=='صار عميلاً')
        # inbox
        await go('#/m/inbox'); await pg.click('[data-act=addItem]'); await fm(pg,{'name':'سائل','phone':'0955555555','service':'درون','source':'واتساب'})
        kp=await pg.locator('.kpi b').all_inner_texts(); ok('inbox new=1',kp[0]=='1',kp)
        # papers numbering + void, no delete/edit
        await go('#/m/papers'); await pg.click('[data-act=addItem]'); await fm(pg,{'code':'INV','name':'الخباز','amount':'650'})
        await pg.click('[data-act=addItem]'); await fm(pg,{'code':'INV','name':'الخباز','amount':'650'})
        await pg.click('[data-act=addItem]'); await fm(pg,{'code':'RCV','name':'الخباز','amount':'325'})
        nos=await pg.evaluate('SHAFQ.db().items.filter(i=>i.kind==="paper").map(i=>i.no)')
        y=(await pg.evaluate('new Date().getFullYear()'))
        ok('paper numbering',nos==[f'INV-{y}-001',f'INV-{y}-002',f'RCV-{y}-001'],nos)
        ok('papers cannot be edited or deleted',await pg.locator('[data-act=editItem]').count()==0 and await pg.locator('[data-act=delItem]').count()==0)
        await pg.locator('details.tile > summary').first.click(); await pg.locator('[data-act=voidPaper]').first.click(); await pg.wait_for_timeout(W)
        await pg.click('[data-act=addItem]'); await fm(pg,{'code':'INV','name':'الخباز','amount':'650'})
        nos=await pg.evaluate('SHAFQ.db().items.filter(i=>i.kind==="paper").map(i=>i.no+"|"+i.status)')
        ok('voided number not reused',nos[0]==f'INV-{y}-001|ملغاة' and nos[3]==f'INV-{y}-003|سارية',nos)
        # gear
        await go('#/m/gear'); await pg.click('[data-act=addItem]'); await fm(pg,{'name':'كاميرا','cat':'كاميرات','shop':'محل','cost':'30','item':pid})
        kp=await pg.locator('.kpi b').all_inner_texts(); ok('gear KPIs',kp[0]=='1' and kp[3]=='$30',kp)
        # calendar, reports, reporter, dashboard
        await go('#/calendar'); ok('calendar shows today drone entry','درون' in await pg.locator('.cald.now').inner_text(),await pg.locator('.cald.now').inner_text())
        await pg.click('[data-act=addEvent]'); await fm(pg,{'name':'اجتماع'}); ok('event added to today','اجتماع' in await pg.locator('.cald.now').inner_text())
        await pg.click('[data-act=calNext]'); await pg.wait_for_timeout(200); ok('calendar next month',await pg.locator('.cald.now').count()==0)
        await pg.screenshot(path='/tmp/m_cal.png')
        await go('#/reports'); t=await pg.locator('main').inner_text(); ok('reports: net $190 and service split','$190' in t and 'المشاريع' in t,t[:200])
        await pg.screenshot(path='/tmp/m_rep.png')
        await go('#/reporter'); t=await pg.locator('main').inner_text(); ok('reporter lists alerts','طلبات لم يُرد عليها' in t and 'طلعة درون بلا تصريح' in t,t[:300])
        await go('#/'); t=await pg.locator('.tiles').inner_text(); ok('dashboard has drone + inbox tiles','الدرون هذا الشهر' in t and 'صندوق الطلبات' in t)
        for r in ['#/m/projects','#/m/drone','#/m/content','#/m/talent','#/m/influencers','#/m/leads','#/m/inbox','#/m/papers','#/m/gear','#/calendar','#/reports','#/reporter','#/tasks','#/team','#/finance','#/profile','#/soon/x']:
            await go(r)
        await go('#/m/leads'); await pg.screenshot(path='/tmp/m_leads.png'); await go('#/m/drone'); await pg.locator('details.tile > summary').first.click(); await pg.screenshot(path='/tmp/m_drone.png')
        if SERVER:
            await pg.wait_for_timeout(1500)
            ok('items stored on server as rows',sql("select count(*) from items")==str(await pg.evaluate('SHAFQ.db().items.length')),sql("select kind,count(*) from items group by 1"))
            ok('move linked to project on server',sql("select count(*) from moves where item_id is not null")=='2')
            ok('project fields in jsonb',sql("select data->>'name'||'|'||(data->>'price') from items where kind='project'")=='مؤتمر تجريبي|500',sql("select data from items where kind='project'"))
            await pg.reload(); await pg.wait_for_timeout(1500)
            ok('items reload from server',await pg.evaluate('SHAFQ.db().items.length')==int(sql("select count(*) from items")))
        ok('no JS errors',not errs,'; '.join(errs)[:400])
        await b.close()
    for n,c,e in R: print('PASS' if c else 'FAIL',n,'' if c else '→ '+e)
    print(f'{sum(1 for r in R if r[1])}/{len(R)} passed')
asyncio.run(main())
