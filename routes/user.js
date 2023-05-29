const { log } = require('debug/src/browser');
var express = require('express');
var router = express.Router();
const nodemailer = require('nodemailer');
require('dotenv').config();
const prjAdm = process.env.My_Own;
const UrlAdmpg = process.env.My_OwnUrl;
const myMail = process.env.My_Mail;
const myMailPass = process.env.My_Mail_Pass;
const url1=process.env.PORT
const messages = [];
const productHelper=require('../functions/function');

const verifyLogin=(req,res,next)=>{
  if(req.session.loggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}

router.get('/', async(req, res, next)=> {
  console.log('url'+url1);
  console.log(prjAdm);
  let user=req.session.user
  if(user){
    if(user.admin===prjAdm){
      var myBoolean1=true
    }else{
      myBoolean1=false
    }
    var read=await productHelper.getOneUser(user._id)
  }else{
    myBoolean1=false
  }
 productHelper.getMessages().then((messagess)=>{
  console.log(messagess);
     productHelper.getOneWeekMod(messagess.module).then((curMod)=>{
      console.log(curMod);
      res.render('user/index', {title: 'LQGR',user:user, admin:myBoolean1,messagess,read,curMod,url:UrlAdmpg})
     })
 })
  });

router.get('/login',(req,res)=>{
  if(req.session.loggedIn){
    res.redirect('/')
  }
  else{
    res.render('user/login',{title: 'LQGR Login','loginErr':req.session.loginErr})
    req.session.loginErr=false
  }
})

router.get('/signup',(req,res)=>{
  res.render('user/signup',{title: 'LQGR Register', 'signupErr':req.session.signupErr}) 
  req.session.signupErr=false;
})

router.post('/user/signup',(req,res)=>{
  productHelper.doSignup(req.body).then((response)=>{
    if(response.signupStatus){
          res.redirect('/login')
    }else{
      req.session.signupErr=true
      res.redirect('/signup')
    }
  })
})
router.post('/user/login',(req,res)=>{
  productHelper.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.loggedIn=true
      let user={
        name:response.user.name,
        _id:response.user._id,
        username:response.user.username,
        read:response.user.read,
        email:response.user.email,
        admin:response.user.admin,
        place:response.user.place,
      }
      req.session.user=user
      res.redirect('/')
    }
    else{
      req.session.loginErr=true
      res.redirect('/login')
    }
  })
})
router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/')
})

router.get('/quiz/m:m/w:w',verifyLogin, async(req,res,next)=>{
  let qnId=req.params.w
  let module=req.params.m
  let user=req.session.user
  let userId=req.session.user._id
  let check= await productHelper.check(userId,qnId,module)
  var startTime
  if(check){
    req.session.user.quizStartTime=null
}else{
  if(req.session.user.quizStartTime){
  startTime=req.session.user.quizStartTime
  console.log('exist-time'+startTime);
}else{
  req.session.user.quizStartTime = new Date().getTime();
  startTime=req.session.user.quizStartTime
  console.log('time'+startTime);
}
}

  if(user.admin===prjAdm){
    var myBoolean=true
  }else{
   myBoolean=false
  }
  
  let options=await productHelper.getOptions(userId,module,qnId)
  let answers={ans:await productHelper.getAnswers(qnId,module)}
  await productHelper.getAllQuestions(qnId,module).then((questions)=>{
    if(questions.qns!=null){
      var qnsLength=questions.qns.length
    }else{
      qnsLength=0;
    }
  
const numbersString = `${options}`;
const ops1 = numbersString.split(",").map(Number);
ops1[0]='0'+ops1[0]
const ops={
   op:options
}
res.render('user/view-questions',{title: 'LQGR Quiz',questions,answers,qnsLength,check:check,ops,ifuser:myBoolean,startTime,user:user,url:UrlAdmpg})
  }) 
})

router.post('/score',(req,res)=>{
  console.log(req.body.userId);
  req.session.user.quizStartTime=null
  productHelper.addScore(req.body)
  res.redirect(`/quiz/m${req.body.modul}/w${req.body.week}`);
})

router.get('/home',(req,res)=>{
  productHelper.getWeekMod().then((weekmod)=>{
    let user=req.session.user
  res.render('user/home',{title: 'LQGR Quiz-List',weekmod, user:user})
  })  
})

router.put("/update-score", (req, res) => {
   const newScore = req.body;
   productHelper.updateOptions(newScore)
  res.status(200).send("Score updated successfully");
});

router.get('/marks/m:m',verifyLogin,(req,res)=>{
  const module=req.params.m
  const user=req.session.user._id
  let ifUser=req.session.user
  productHelper.getModuleWiseMarks(user,module).then((mark)=>{
    
    if(mark){
    var sum = mark.reduce((acc, cur) => {if(cur.score===null){return (acc+0)} else{return (acc + parseInt(cur.score))}}, 0);
    }else{
      sum=0
    }
   productHelper.getModuleEnd(module).then((moduleEnd)=>{
  res.render('user/scores',{title: 'LQGR Mark',mark,module,sum,user:ifUser,moduleEnd})
   })
      })  
})

router.post('/get-scores',(req,res)=>{
  res.redirect('/marks/m'+req.body.module)
})

router.get('/pdfs', (req,res)=>{
  productHelper.getAllPdfs().then((pdfs)=>{
    let user=req.session.user
    if(user){
    if(user.admin===prjAdm){
      var myBoolean=true
    }else{
      myBoolean=false
    }
  }else{
    myBoolean=false
  }
    res.render('user/pdfs',{title: 'LQGR Documents',pdfs, user1:myBoolean, user:user,url:UrlAdmpg});
  })
})

router.get('/download/:id', (req, res) => {
  const id = req.params.id;
 productHelper.getPdf(id).then((pdf)=>{
  res.download(''+pdf.path)
 })
});

router.get('/viewpdf/:id', (req,res)=>{
  const id = req.params.id;
 productHelper.getPdf(id).then((pdf)=>{
  const path=__dirname
  const filePath = pdf.path
  var newStr = path.replace('routes','')
    res.sendFile(`${newStr}${filePath}`)
 })
})

router.get('/forgotpassword',(req,res)=>{
  res.render('user/update-password',{status:req.session.upErr})
  req.session.upErr=false
})

router.post('/user/forgotpassword', (req,res)=>{
  productHelper.updatePassword(req.body).then((response)=>{
    if(response){
    res.redirect('/login')
    }
    else{
      req.session.upErr=true
      res.redirect('/forgotpassword')
    }
  })
})

router.get('/about',(req,res)=>{
  let user=req.session.user
  res.render('user/about',{title: 'LQGR About',user})
})

router.post('/aboutus', (req, res) => {
  const { email,name,phone, message } = req.body;
 const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: myMail,
      pass: myMailPass,
    },
    tls: {rejectUnauthorized: false}
  });

  // set up the email message
  const mailOptions = {
    from: email,
    to: myMail,
    subject: 'New message from website contact form',
    text: `${name},\n\n${message},\n\nEmail : ${email},\n\nPhone No. : ${phone}`,
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      res.status(500).send('Error sending email');
    } else {
      res.redirect('/about');
    }
  });
});

router.put('/mark-as-read', (req,res)=>{
  productHelper.updateMessageRead(req.body)
  res.status(200).send("Score updated successfully");
})

router.get('/winners/m:m',(req,res)=>{
  m=req.params.m
  user=req.session.user
  productHelper.getAllModuleMarks(m).then((scores)=>{
   productHelper.getModuleEnd(m).then((moduleEnd)=>{
      res.render('user/winners',{title: 'LQGR Winners',scores,m,moduleEnd,user}) 
    })
  })
})

router.post('/get-score',(req,res)=>{
  res.redirect('winners/m'+req.body.module)
})

module.exports = router;
