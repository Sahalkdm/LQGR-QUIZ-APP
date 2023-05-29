var express = require('express');
var router = express.Router();
//const multer = require('multer');
//const XLSX = require('xlsx');
//const fileSaver = require('file-saver');
require('dotenv').config();
const prjAdm = process.env.My_Own;
const secCode = process.env.My_secCode;
const UrlAdmpg = process.env.My_OwnUrl;
const url=process.env.PORT

const productHelper=require('../functions/function');
const { log } = require('debug/src/browser');

const verifyAdmin=(req,res,next)=>{
  if(req.session.user){
  if(req.session.user.admin===prjAdm){
    next()
  }else{
    res.redirect('/')
  }}else{
    res.redirect('/')
  }
}

router.get('/',verifyAdmin, function(req, res, next) {
  let user=(req.session.user)
  if(user){ var isAdmin=user.admin}else{isAdmin=false}
  res.render('admin/admin-page', { title: 'LQGR Admin-Dashboard', admin:isAdmin, user:user , secCode:secCode, url:UrlAdmpg});
});

router.get('/add-qns/m:m/w:id',verifyAdmin, function(req, res, next) {
  let qnId=req.params.id
  let mod=req.params.m
  res.render('admin/add-qns',{title: 'LQGR Add-Question',qnId,mod,admin:true,url:UrlAdmpg});
});

router.get('/add-week',verifyAdmin, function(req, res, next) {
  productHelper.getAllPdfs().then((pdfs)=>{
    res.render('admin/add-week',{title: 'LQGR Add-Week',pdfs,admin:true,url:UrlAdmpg});
  })
});

router.post('/add-qns',(req,res)=>{
 productHelper.addQns(req.body)
  let week=parseInt(req.body.id)
  let mod=parseInt(req.body.md)
  res.redirect(`/${UrlAdmpg}/add-qns/m${mod}/w${week}`)
})

router.post('/add-week',(req,res)=>{
  productHelper.CreateWeek(req.body)
  let week=parseInt(req.body.week)
  let mod=parseInt(req.body.modul)
  res.redirect(`/${UrlAdmpg}/add-qns/m${mod}/w${week}`)
})

router.get('/view-score/m:m',verifyAdmin,(req,res)=>{
  m=req.params.m
  productHelper.getAllModuleMarks(m).then((scores)=>{
     productHelper.getModuleEnd(m).then((moduleEnd)=>{
      res.render('admin/view-score',{title: 'LQGR View-Score',scores,m,moduleEnd,admin:true,url:UrlAdmpg})
    })
  
  })  
})

  router.get('/quiz-list', (req,res)=>{
    
    productHelper.getWeekMod().then((weekmod)=>{
    res.render('admin/quiz-list',{title: 'LQGR Quiz-List',weekmod,url:UrlAdmpg})
    })
  })

  router.get('/edit-qns/:id/:i',verifyAdmin, (req,res)=>{
    let id=req.params.id
    let i=req.params.i
    productHelper.getOneQuestion(''+id).then((qns)=>{
      res.render('admin/edit-qns', {title: 'LQGR Edit-Question',qns:qns.qns[i], id,i,admin:true,url:UrlAdmpg})
    })
  })

  router.post('/edit-qns', (req,res)=>{
    let m=req.body.md
    let w=req.body.id
    productHelper.updateQuestion(req.body).then((response)=>{
          res.redirect('/quiz/m'+m+'/w'+w)
    })
  })

  router.get('/delete-qn/:m/:w/:id/:i', (req,res)=>{
    let id=req.params.id
    let i=req.params.i
    let m=req.params.m
    let w=req.params.w
    productHelper.deleteQuestion(id,i).then((response)=>{
      res.redirect('/quiz/m'+m+'/w'+w)
    })
  })

  router.get('/update-date/:id/md:m/wk:w',verifyAdmin, (req,res)=>{
    let id=req.params.id
    let m=req.params.m
    let w=req.params.w
    res.render('admin/update-date',{title: 'LQGR Delete-Date',id,m,w,admin:true,url:UrlAdmpg})
  })

  router.post('/update-date/:id',(req,res)=>{
    let id=req.params.id
    productHelper.updateDate(req.body,id)
      res.redirect('/')
    })

    router.get('/submit-quiz',verifyAdmin, async(req,res,next)=>{
      let submissionCheck=await productHelper.checkSubmission()
      productHelper.getWeekMod().then((weekmod)=>{
        res.render('admin/submit-quiz',{weekmod,submissionCheck,admin:true,url:UrlAdmpg})
      })
      
    })

    router.get('/submit-quiz/m:m/w:w',(req,res)=>{
      let m=req.params.m
      let w=req.params.w
      productHelper.submitScore(m,w).then((response)=>{
        res.redirect(`/${UrlAdmpg}/submit-quiz`)
      })
    })

    router.get('/markasdone/m:m',(req,res)=>{
      let m=req.params.m
      productHelper.markAsDone(m)
      res.redirect(`/${UrlAdmpg}/submit-quiz`)
    })

    router.post('/get-score',(req,res)=>{
      res.redirect('view-score/m'+req.body.module)
    })

    router.get('/add-message',verifyAdmin,(req,res)=>{
      productHelper.getMessages().then((msg)=>{
         res.render('admin/addMessage',{title: 'LQGR Add-Message',msg,admin:true,url:UrlAdmpg})
      })
     
    })

    router.post('/send-message',(req,res)=>{
      productHelper.storeMessages(req.body)
      res.redirect(`/${UrlAdmpg}/add-message`)
    })

    router.get('/deleteMessage/:m',(req,res)=>{
      let msg=req.params.m
      productHelper.deleteMessage(msg)
      res.redirect(`/${UrlAdmpg}/add-message`)
    })

    router.post('/set-current-module',(req,res)=>{
      productHelper.addCurrentModule(req.body.module)
      res.redirect('/')
    })

    router.get('/start-quiz/m:m/w:w',(req,res)=>{
      let m=req.params.m
      let w=req.params.w
      productHelper.startQuiz(m,w)
        res.redirect(`/${UrlAdmpg}/submit-quiz`)
    })

    router.get('/user-manager',verifyAdmin,(req,res)=>{
      productHelper.getUsersData().then((data)=>{
        res.render('admin/user-manager', {title: 'LQGR User-Manager',data,admin:true,url:UrlAdmpg})
      })  
    })

  module.exports = router;
