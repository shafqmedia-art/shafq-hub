import asyncio
from playwright.async_api import async_playwright
U='http://localhost:8765/index.html'
PAY=['"><img src=x onerror="window.__x=(window.__x||0)+1">',"'><svg onload=window.__x=(window.__x||0)+1>","</textarea><img src=x onerror=window.__x=(window.__x||0)+1>","javascript:window.__x=(window.__x||0)+1"]
async def fm(page,vals):
    for k,v in vals.items():
        el=page.locator(f'#m_{k}')
        if await el.evaluate('e=>e.tagName')=='SELECT': await el.select_option(v)
        else: await el.fill(v)
    await page.locator('#modal button[type=submit]').click(); await page.wait_for_timeout(200)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        page=await (await b.new_context(viewport={'width':1300,'height':900},service_workers='block')).new_page()
        dialogs=[]; page.on('dialog',lambda d:(dialogs.append(d.message),asyncio.ensure_future(d.dismiss())))
        await page.goto(U); await page.wait_for_timeout(3200)
        await page.fill('#s_name','مدير'); await page.fill('#s_phone','0952000000'); await page.fill('#s_pass','secret12'); await page.click('form[data-form=setup] button'); await page.wait_for_timeout(500)
        # build data through UI
        await page.goto(U+'#/clients'); await page.wait_for_timeout(200)
        await page.click('[data-act=addClient]'); await fm(page,{'name':'c1','value':'100','months':'2'})
        await page.goto(U+'#/team'); await page.wait_for_timeout(200)
        await page.click('[data-act=addMember]'); await fm(page,{'name':'m1','phone':'0911111111','pass':'12345678'})
        mid=await page.evaluate("SHAFQ.db().users[1].id"); cid=await page.evaluate("SHAFQ.db().clients[0].id")
        await page.goto(U+'#/tasks'); await page.wait_for_timeout(200)
        await page.click('[data-act=addTask]'); await fm(page,{'title':'t1','user_id':mid,'client_id':cid})
        await page.goto(U+'#/finance'); await page.wait_for_timeout(200)
        await page.click('.acts [data-act=addMove]'); await fm(page,{'amount':'10','client_id':cid,'service':'s'})
        mods=await page.evaluate("Object.keys(window.SHAFQ_MODS||{})")
        # add one item of each module via db directly
        await page.evaluate("""([cid,mid])=>{var db=SHAFQ.db();['post','project','drone','talent','influencer','lead','request','paper','equip'].forEach((k,i)=>db.items.push({id:'it'+i,kind:k,status:'x',name:'n',client_id:cid,owner:mid,account:'acc',skills:'a,b',notes:'z',date:'2026-11-14',time:'10:00',type:'ريل',code:'INV',no:'INV-2026-001',phone:'0911',source:'s',service:'s'}));db.clients[0].roles=[{role:'r',user:mid}];SHAFQ.save()}""",[cid,mid])
        # poison every string field
        n=await page.evaluate("""(P)=>{var db=SHAFQ.db(),k=0,skip=/^(id|user_id|client_id|owner|kind|date|due|time|role|dir|cur|start_date|created|done_at|gender|active|pass|salt|code)$/;
          function poison(o){Object.keys(o).forEach(f=>{if(skip.test(f))return; if(typeof o[f]==='string'){o[f]=P[k++%P.length]+o[f];} else if(Array.isArray(o[f])) o[f].forEach(x=>{if(x&&typeof x==='object')poison(x)});});}
          ['users','clients','tasks','moves','items'].forEach(t=>db[t].forEach(poison)); db.settings.shafq_phone=P[0]; SHAFQ.save(); return k}""",PAY)
        print('poisoned fields:',n)
        routes=['#/','#/clients','#/client/'+cid,'#/team','#/tasks','#/finance','#/profile','#/calendar','#/reports','#/reporter','#/m/content','#/m/projects','#/m/drone','#/m/talent','#/m/influencers','#/m/leads','#/m/inbox','#/m/papers','#/m/equipment']
        for r in routes:
            await page.goto(U+r); await page.wait_for_timeout(250)
            await page.locator('details').evaluate_all('es=>es.forEach(e=>e.open=true)'); await page.wait_for_timeout(100)
            for act in ['editMember','editClient','editItem','sendNote']:
                loc=page.locator(f'[data-act={act}]')
                if await loc.count(): 
                    try: await loc.first.click(timeout=1000); await page.wait_for_timeout(150); await page.click('#modal [data-act=close]',timeout=1000)
                    except Exception: pass
        # member + portal views
        x=await page.evaluate('window.__x||0')
        print('XSS executions:',x,'dialogs:',dialogs)
        hrefs=await page.evaluate("[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')).filter(h=>/^\\s*javascript:/i.test(h))")
        print('javascript: links on last page:',hrefs)
        await b.close()
asyncio.run(main())
