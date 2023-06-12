const { log } = require('debug/src/browser');
const { ObjectId } = require('mongodb');
var db=require('../config/connection')
var objId=require('mongodb').ObjectId


module.exports={
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
          let response={}
          let user=await db.get().collection('users').findOne({username:userData.username})
             if (user){
              response.signupStatus=false
             }else{
              response.signupStatus=true
              db.get().collection('users').insertOne(userData)
             }
         resolve(response)
        })
     },
     doLogin:(userData)=>{
         return new Promise(async (resolve,reject)=>{
             let loginStatus=false;
             let response={}
             let user=await db.get().collection('users').findOne({username:userData.username})
             if (user)
                 if(userData.password===user.password)
                  {
                     response.user=user
                     response.status=true 
                     resolve(response)
                 }
                 else
                  resolve({status:false})             
             else {
                 resolve({status:false})
             }
         })
     },

    CreateWeek:(qns)=>{
        qns.qns=[]
        return new Promise(async(resolve,reject)=>{
            let qnExist=await db.get().collection('qns').findOne({week:qns.week, modul:qns.modul})
            if(qnExist){
               console.log('exists');
            }else{
                 db.get().collection('qns').insertOne(qns).then(()=>{
        })
    }
        let modExist=await db.get().collection('modweeks').findOne({modul:qns.modul})
        let weekExist=await db.get().collection('modweeks').findOne({weeks:qns.week, modul:qns.modul})
        if(modExist){
           if(weekExist){
            console.log('weekExist and mod');
           }
           else{
            db.get().collection('modweeks').updateOne(
                { modul:qns.modul},
                { $push: { weeks:qns.week } }
             )
           }
        }else{
            db.get().collection('modweeks').insertOne({modul:qns.modul})
           db.get().collection('modweeks').updateOne(
            { modul:qns.modul},
            { $push: { weeks:qns.week } }
         )
        }
        db.get().collection('qns').updateOne(
          { modul:qns.modul, week:qns.week},
          { $set: { status:'Not-started' } }
       )
        })
       
    },

    addQns:(qn)=>{
       db.get().collection('qns').updateOne(
            { week: qn.id , modul:qn.md},
            { $push: { qns:qn  } }
         )
    },

    getAllQuestions:(id,m)=>{
       return new Promise(async(resolve,reject)=>{
            let questions=await db.get().collection('qns').findOne({week:`${id}` , modul:`${m}`})
            resolve(questions)
        })
    },

    getAnswers:(id,m)=>{
        return new Promise(async(resolve,reject)=>{
            let answers=await db.get().collection('qns').aggregate([
                {
                    $match:{week:`${id}` , modul:`${m}`}
                },
                {
                    $unwind:'$qns'
                },
                {
                    $project:{
                        ans:'$qns.ans',
                    }
                }
                
            ]).toArray()

            var finalArray = answers.map(function (obj) {
                return obj.ans;
              });
              for(let i = 0; i<finalArray.length;i++){
                finalArray[i]=''+i+finalArray[i]
              }
            resolve(finalArray)
        })
    },
    addScore:(data)=>{
        db.get().collection('users').updateOne(
            { 
              _id: ObjectId(`${data.userId}`), 
              scoreSheet: { $elemMatch: { week: `${data.week}`, modul: `${data.modul}` } }
            },
            { $set: { 'scoreSheet.$.score': data.score } } 
          );

    },
    check:(userId,wee,modul)=>{
        return new Promise(async(resolve,reject)=>{
           let scoreExist= await db.get().collection('users').findOne({_id: ObjectId(`${userId}`),scoreSheet: {$elemMatch: {week:wee, modul:modul}}})

           if(scoreExist){
            await db.get().collection('users').findOne({_id: ObjectId(`${userId}`),scoreSheet: {$elemMatch: {week:wee, modul:modul}}},
            { "scoreSheet.$": 1 }, 
                (err, doc) => {
                  if (err) {
                    console.log("Error getting score:", err);
                  } else if (!doc) {
                    console.log("Score not found");
                  } else {
                    const score = doc.scoreSheet.filter(score => (score.modul === `${modul}` && score.week===`${wee}`))[0].score;
                    console.log("Score found:"+score);
                    if(score!=null){
                        resolve(true)
                     }
                     else{
                         resolve(false)
                     }
                  }
                })
           }else{
            resolve(false)
           }
            })
    },

    getWeekMod:()=>{
        return new Promise(async(resolve,reject)=>{
            let weekmod=await db.get().collection('modweeks').find().toArray()
            resolve(weekmod)
        })
    }, 

    getScores:()=>{
        return new Promise(async(resolve,reject)=>{
            let score=await db.get().collection('users').find().toArray()
            resolve(score)
        })
    },

    updateOptions:(data)=>{

        db.get().collection('users').updateOne(
            { 
              _id: ObjectId(`${data.userid}`), 
              scoreSheet: { $elemMatch: { week: `${data.week}`, modul: `${data.module}` } }
            },
            { $set: { [`scoreSheet.$.array.${data.index}`]: data.id } }
          );
        
    },
    
    getOptions:(user,module,week)=>{
        return new Promise(async(resolve,reject)=>{

            let weekmodExist=await db.get().collection('users').findOne({_id: ObjectId(`${user}`),scoreSheet: {$elemMatch: {week:week, modul:module}}})
            const body={
                week:week,
                modul:module,
                score:null,
                array:[]
            }
            if(weekmodExist){
                console.log('exist');
            }else{
                db.get().collection('users').updateOne(
                    { _id: ObjectId(`${user}`) },
                    { $push: {scoreSheet:body} }
                 )
            }

            await db.get().collection('users').findOne(
                { _id: ObjectId(`${user}`), "scoreSheet": { "$elemMatch": { "week": `${week}`, "modul": `${module}` } } }, 
                { "scoreSheet.$": 1 }, 
                (err, doc) => {
                  if (err) {
                    console.log("Error getting option:", err);
                  } else if (!doc) {
                    console.log("option not found");
                  } else {
                    const score = doc.scoreSheet.filter(score => (score.modul === `${module}` && score.week===`${week}`))[0].array;
                    resolve(score)
                  }
                }
              );
            
        })
    },
    getModuleWiseMarks:(user,module)=>{

        return new Promise(async(resolve,reject)=>{
          let weekmodExist=await db.get().collection('users').findOne({_id: ObjectId(`${user}`),scoreSheet: {$elemMatch: { modul:module}}})
          if(weekmodExist){
        await db.get().collection('users').findOne(
            { _id: ObjectId(`${user}`) },
            (err, doc) => {
              if (err) {
                console.log("Error getting score:", err);
              } else if (!doc) {
                console.log("Score not found");
              } else {
                const scoresWithModul1 = doc.scoreSheet.filter(score => (score.modul === `${module}`));
                scoresWithModul1.sort((score1, score2) => parseInt(score1.week) - parseInt(score2.week));
               resolve(scoresWithModul1)
              }
            }
            
          )}else{
            resolve()
          };    
    })
    },

    uploadPdf:(pdf)=>{
      db.get().collection('pdf').insertOne(pdf).then((data)=>{
       })
  },

  getAllPdfs:(id)=>{
    return new Promise(async(resolve,reject)=>{
      let pdfs=await db.get().collection('pdf').find().toArray()
      resolve(pdfs)
    })
  },

  getPdf:(id)=>{
    return new Promise(async(resolve,reject)=>{
      let pdf=await db.get().collection('pdf').findOne({ _id: ObjectId(id)})
      resolve(pdf)
    })
  },

  updatePassword:(body)=>{
    return new Promise(async(resolve,reject)=>{
      let emailExist=await db.get().collection('users').findOne({ username: body.username})
      if(emailExist){
      await db.get().collection('users').updateOne(
        { username: body.username},
        {$set:{password:body.password, confirmpassword:body.confirmpassword}}).then((response)=>{
          resolve(true)
        })
      }else{
        resolve(false)
      }
      
    })
  },

  getOneQuestion:(id)=>{
    return new Promise(async(resolve,reject)=>{
      let pdf=await db.get().collection('qns').findOne({ _id: ObjectId(id)})
      resolve(pdf)
    })
  },

  updateQuestion:(data)=>{
    let index=data.i
    return new Promise(async(resolve,reject)=>{
      await db.get().collection('qns').updateOne(
        { 
          _id: ObjectId(`${data._id}`),
        },
        { $set: { 
          ["qns." + index + ".qn"]: data.qn , 
          ["qns." + index + ".op1"]: data.op1 ,
          ["qns." + index + ".op2"]: data.op2 ,
          ["qns." + index + ".op3"]: data.op3 ,
          ["qns." + index + ".op4"]: data.op4 ,
          ["qns." + index + ".ans"]: data.ans 
        } } 
      ).then((response)=>{
        resolve(response)
      })
    })
  },

  getOneWeek:(id)=>{
    return new Promise(async(resolve,reject)=>{
      let weekDate=await db.get().collection('qns').findOne({ _id: ObjectId(id)})
      resolve(weekDate)
    })
  },

  updateDate:(data,id)=>{
    return new Promise(async(resolve,reject)=>{
      await db.get().collection('qns').updateOne(
        { 
          _id: ObjectId(`${id}`),
        },
        { $set: {
          day:data.day,
          month:data.month,
          year:data.year
        }}
      )})
  },

  deleteQuestion:(id,i)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection('qns').updateOne({ _id: ObjectId(`${id}`) },{$unset:{["qns."+i]:1}}).then(()=>{
        db.get().collection('qns').updateOne({ _id: ObjectId(`${id}`) },{$pull:{"qns":null}}).then((response)=>{
          resolve(response)
        })
      })
    })
},

deleteDocument:(id)=>{
  return new Promise(async(resolve,reject)=>{
    await db.get().collection('pdf').deleteOne({ _id: ObjectId(id)}).then((response)=>{
      resolve(response)
    })
    
  })
},

submitScore:(m,w)=>{
  return new Promise(async(resolve,reject)=>{
    let answers=await db.get().collection('qns').aggregate([
        {
            $match:{week:`${w}` , modul:`${m}`}
        },
        {
            $unwind:'$qns'
        },
        {
            $project:{
              ans: '$qns.ans'
            }
        }
        
    ]).toArray()

    var finalArray = answers.map(function (obj) {
        return obj.ans;
      });
     

      for(let i = 0; i<finalArray.length;i++){
        finalArray[i]=''+i+finalArray[i]
      }
      let users=await db.get().collection('users').find(
        { "scoreSheet": { "$elemMatch": {"week":`${w}` , "modul":`${m}`} } },
        { "scoreSheet.$": 1 }
      ).toArray()

      users.map((user)=>{
        const myArray = user.scoreSheet.filter(score => (score.modul === `${m}` && score.week===`${w}`));
        let myArr=myArray[0].array
        var score=0
        for(let j = 0; j<finalArray.length;j++){
          if(myArr[j]===finalArray[j]){
            score=score+1
          }
          
        }
        db.get().collection('users').updateOne(
          { 
            _id: ObjectId(`${user._id}`), // specify the email of the user to update
            scoreSheet: { $elemMatch: { week: `${w}`, modul: `${m}` } } // find the element to update with the specified week and modul
          },
          { $set: { 'scoreSheet.$.score': score } } // add the new score to the matched element
        ).then((response)=>{
        resolve(response);
      })
      })   
      
      await db.get().collection('qns').updateOne({ week: `${w}`, modul: `${m}` },{$set:{done:true, status:'finished'}})
})
},
 
markAsDone:(m)=>{
  db.get().collection('modweeks').updateOne({modul:`${m}`},{$set:{done:true}})
},

getModuleEnd:(m)=>{
  return new Promise(async(resolve,reject)=>{
    let weekmod=await db.get().collection('modweeks').findOne({modul:`${m}`})
    resolve(weekmod)
})
},

getAllModuleMarks:(m)=>{
  return new Promise(async(resolve,reject)=>{
  let users=await db.get().collection('users').find(
    { "scoreSheet": { "$elemMatch": {"modul":`${m}`} } },
    { "scoreSheet.$": 1 }
  ).toArray()
let response=[]

  users.map((user,index)=>{
    const myArray = user.scoreSheet.filter(score => (score.modul === `${m}`));
    var sum=0
    sum = myArray.reduce((acc, cur) => {if(cur.score===null){return (acc+0)} else{return (acc + parseInt(cur.score))}}, 0);
    response[index]={
      name:user.name,
      email:user.email,
      age:user.age,
      phone:user.phone,
      place:user.place,
      score:sum
    }
  })
  resolve(response)
})},

storeChat:(data)=>{
  return new Promise(async(resolve,reject)=>{
    console.log('chat called');
    let modExist=await db.get().collection('chat').findOne({name:'chats1'})
    if(modExist){
      db.get().collection('chat').updateOne(
        { name:'chats1'},
        { $push: { chats:data } }
     )
    }else{
      db.get().collection('chat').insertOne({name:'chats1'})
      db.get().collection('chat').updateOne(
        { name:'chats'},
        { $push: { chats:data } }
     )
    }
  }) 
},

getChats:()=>{
  return new Promise(async(resolve,reject)=>{
    let chats=await db.get().collection('chat').findOne({name:'chats1'})
    resolve(chats)
  })
},

deleteChat:(name,date)=>{
  return new Promise((resolve,reject)=>{
    db.get().collection('chat').updateOne({name: 'chats1'},{$pull:{"chats":{"name":`${name}`, "date":`${date}`}}})
  })
},

deleteChats:(n)=>{
  return new Promise((resolve,reject)=>{
    for(let i=0;i<n;i++){
      db.get().collection('chat').updateOne({ name: 'chats1' },{$unset:{["chats."+i]:1}}).then(()=>{
      db.get().collection('chat').updateOne({name: 'chats1' },{$pull:{"chats":null}})
    })
    }
    resolve(true)
  })
},

storeMessages:(data)=>{
  return new Promise(async(resolve,reject)=>{
    let msgExist=await db.get().collection('messages').findOne({name:'msg1'})
    if(msgExist){
      db.get().collection('messages').updateOne(
        { name:'msg1'},
        { $push: { messages:data } }
     )
    }else{
      db.get().collection('messages').insertOne({name:'msg1'})
      db.get().collection('messages').updateOne(
        { name:'msg1'},
        { $push: { messages:data } }
     )
    }
    db.get().collection('users').updateMany({ admin:'false'},{$set:{read:'true'}})
  }) 
},

getMessages:()=>{
  return new Promise(async(resolve,reject)=>{
    let messages=await db.get().collection('messages').findOne({name:'msg1'})
    console.log(messages);
    resolve(messages)
  })
},

updateMessageRead:(data)=>{
  return new Promise(async(resolve,reject)=>{
    await db.get().collection('users').updateOne({_id: ObjectId(`${data.id}`)},{$set:{read:'false'}})
  })
},

getOneUser:(id)=>{
  return new Promise(async(resolve,reject)=>{
    let user=await db.get().collection('users').findOne({_id: ObjectId(`${id}`)})
    resolve(user.read)
  })
},

deleteMessage:(i)=>{
  return new Promise((resolve,reject)=>{
    db.get().collection('messages').updateOne({name: 'msg1'},{$unset:{["messages."+i]:1}}).then(()=>{
      db.get().collection('messages').updateOne({name: 'msg1'},{$pull:{"messages":null}}).then((response)=>{
        resolve(response)
      })
   })
  })},

  checkSubmission:()=>{
    return new Promise(async(resolve,reject)=>{
      let answers=await db.get().collection('qns').aggregate([
          {
              $project:{
                module:'$modul',
                week:'$week',
                done: '$done',
                status:'$status'
              }
          }
          
      ]).toArray()
      resolve(answers)
  }
    )},

    addCurrentModule:(data)=>{
      db.get().collection('messages').updateOne(
        { name:'msg1'},
        { $set: { currentModule:data } }
     )
    },

    getOneWeekMod:(m)=>{
      return new Promise(async(resolve,reject)=>{
          await db.get().collection('modweeks').findOne({modul:m}).then((weekmod)=>{
            resolve(weekmod)
          })      
      })
  },

  getUsersData:()=>{
    return new Promise(async(resolve,reject)=>{
      let userData=await db.get().collection('users').aggregate([
          {
              $project:{
                name:'$name',
                email:'$email',
                age:'$age',
                phone: '$phone',
                place:'$place',
                username:'$username'
              }
          }
          
      ]).toArray()
      resolve(userData)
  })
  },

  startQuiz:(m,w)=>{
    db.get().collection('qns').updateOne({modul:`${m}`,week:`${w}`},{$set:{status:'started'}})
  },
    
    storeFeedbacks:(data)=>{
    return new Promise(async(resolve,reject)=>{
      let msgExist=await db.get().collection('messages').findOne({name:'feedbacks'})
      if(msgExist){
        db.get().collection('messages').updateOne(
          { name:'feedbacks'},
          { $push: { feedbacks:data } }
       )
      }else{
        db.get().collection('messages').insertOne({name:'feedbacks'})
        db.get().collection('messages').updateOne(
          { name:'feedbacks'},
          { $push: { feedbacks:data } }
       )
  }
    })
  },

  getFeedbacks:()=>{
    return new Promise(async(resolve,reject)=>{
      let feedbacks=await db.get().collection('messages').findOne({name:'feedbacks'})
      console.log(feedbacks);
      resolve(feedbacks)
    })
  },

}
