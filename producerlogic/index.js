const express= require("express")
const app= express()
const cors= require("cors")
app.use(cors());
app.use(express.json());







//------------ KAFKA ADMIN SETUP -----------------------------


const {kafka}= require('./client')

async function init(){
    const admin = kafka.admin()
    console.log("Admin connecting....")
    admin.connect()
    console.log("Admin connected....")
    console.log("Gonna start creating topic....")
    await admin.createTopics({
        topics: [{
            topic: 'emoji2',
            numPartitions: 1


        }]
    })
    console.log("Topics have been created")
    console.log("Disconnecting Admin")
    await admin.disconnect()
}

init()









app.post('/api/emo',async (req,res)=>{

    const {a,b,c} = req.body



})

