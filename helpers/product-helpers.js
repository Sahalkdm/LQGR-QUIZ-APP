
var db=require('../config/connection')

module.exports={

    doLogin:(data)=>{
        return new Promise(async (resolve,reject)=>{
            db.get().collection('user').insertOne(data).then((response)=>{
                resolve(response)
            })
        })
    }
}