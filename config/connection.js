const { MongoClient } = require('mongodb');
require('dotenv').config();
const mongoUrl = process.env.MONGODB_URI;

const state={
    db:null
}
module.exports.connect=function(done){
    const uri=''+mongoUrl;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    client.connect((err) => {
        if (err) {
          console.error(err);
          process.exit(1);
        }
         state.db = client.db('myFirstDatabase');
         done()
    })      
}

module.exports.get=function(){
    return state.db
}
