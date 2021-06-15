const TESTING = false
let serverAccount
let appName

if(TESTING){
    serverAccount = "craftydude"
    appName = "proofofbrainTesting"
    document.getElementById("header").innerHTML = "~ Proof Of Brain (Testnet) ~"
}else{
    serverAccount = "proofofbrain"
    appName = "proofofbrain"
}

const defaultAnswer = ["00","01","02","10","11","12","20","21","22"]
const REASON_WRONG = "wrong"
const REASON_CORRECT = "correct"
const REASON_INVALID = "invalid"
const footer = document.getElementById("footer")
const currentGameDiv = document.getElementById("currentGame")
const gameHistory = document.getElementById("gameHistory")
const statsDiv = document.getElementById("statsHistory")
const rankDiv = document.getElementById("rank")
const tokensDiv = document.getElementById("tokens")
const livesDiv = document.getElementById("lives")
const streakDiv = document.getElementById("streak")
const client = new dhive.Client(["https://api.hive.blog", "https://api.hivekings.com", "https://anyx.io", "https://api.openhive.network"]);
const blockchain = new dhive.Blockchain(client)


let player = "";
let privateKey;
let answer = ["00","01","02","10","11","12","20","21","22"]
let prevBg = window.getComputedStyle(footer, false).backgroundColor
let loopingHistory = true
let sending = false
let gameId = ""
let previous = null
let prevIdx = -1
let nextBlock

function sendAnswer(){
    if(!sending && player.length > 0 && privateKey !== null){
        let json = JSON.stringify({answer:answer.join(","),gameId})
        let op1 ={id:appName,json,required_auths:[],required_posting_auths:[player]}
        sending = true
        document.body.style.cursor = 'wait';
        footer.style.cursor = 'wait'
        document.getElementById("footer").style.background = "orange";
        client.broadcast.json(op1,privateKey).then(result =>{
            sending = false

            console.log(result)
        })
    } 
}

function backToDefault(){
    document.getElementById("footer").style.background = prevBg;
    document.body.style.cursor = 'default';
    footer.style.cursor = 'pointer'
}

function getGame(){ //checks Posting Json Metadata
    client.database.getAccounts([serverAccount]).then(result =>{
        for(let account of result){
            if(account.hasOwnProperty("posting_json_metadata")){
                let metadata = JSON.parse(account.posting_json_metadata)
                if(metadata.hasOwnProperty("game")){
                    let currentGame = metadata.game.gameId
                    if(currentGame !== gameId){
                        console.log("FOUND NEW GAME: "+metadata.game.gameId)
                        gameId = currentGame
                        currentGameDiv.innerHTML = "Current Game: "+currentGame
                        loadJigsaw(metadata.game)
                    }
                }
            }
        }
    })
}

function imgClick(element){
    let i = element.id.slice(3)
    let img = document.getElementById("img"+i)
    if(previous === null){ //selected
        previous = img
        prevIdx = i
        img.classList.toggle("selected")
    }
    else if(previous.id === "img"+i){ //unselected
        img.classList.toggle("selected")
        previous = null
    }
    else{ //time to swap
        previous.classList.toggle("selected")
        let style = img.currentStyle || window.getComputedStyle(img, false)
        let bg = style.backgroundImage
        let pstyle = previous.currentStyle || window.getComputedStyle(previous,false)
        let pbg = pstyle.backgroundImage

        if(i == 0 || prevIdx == 0 || i == 8 || prevIdx == 8){
            img.style.backgroundImage = pbg
            previous.style.backgroundImage = bg
        }else{
            let order = img.style.order
            img.style.order = previous.style.order
            previous.style.order = order
            img.setAttribute("id","img"+prevIdx)
            previous.setAttribute("id", "img"+i)
        }

        previous = null
        let iValue = answer[i]
        answer[i] = answer[prevIdx]
        answer[prevIdx] = iValue
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
 }

 function loadJigsaw(json){
     answer = [...defaultAnswer]
     let base = json.baseUrl
     base += json.gameId+"/"
    for(let i=0; i <=8;i++){
        let id = ""
        switch(i){
            case 0:
                id = "00"
                break
            case 1:
                id = "01"
                break
            case 2:
                id = "02"
                break
            case 3:
                id = "10"
                break
            case 4:
                id = "11"
                break
            case 5:
                id = "12"
                break
            case 6:
                id = "20"
                break
            case 7:
                id = "21"
                break
            case 8:
                id = "22"
                break
        }
        id += json.imgExt
        let box = document.getElementById("img"+i)
        let url = 'url("'+base+id+'")'
        box.style.backgroundImage = url
    }
 }

 function populateStats(text,clazz){
    let p = document.createElement("P")
    p.classList.add(clazz)
    p.innerHTML=text
    statsDiv.prepend(p)
 }

function setStatsTitle(){
    let title = document.getElementById("statsTitle")
    title.innerHTML = player.toUpperCase()+" Stats"
}

function login(){
    let name = document.getElementById("loginName").value
    let pass = document.getElementById("loginPass").value
    let remember = document.getElementById("loginCheckbox").checked

    if(pass.length == 51){
        let public2 = dhive.PrivateKey.fromString(pass).createPublic().toString()
        client.database.getAccounts([name]).then(result => {
            let public = result[0].posting.key_auths[0][0]
            if(public === public2){
                document.getElementById("loginPass").value = ""
                document.getElementById("footer").style.display = "block"
                document.getElementById("loginStatus").style.display = "none"
                privateKey = dhive.PrivateKey.fromString(pass)
                player = name
                if(remember){
                    localStorage.setItem("username",name)
                    localStorage.setItem("postingKey",pass)
                }
                document.getElementById("loginBox").style.display = "none"
                document.getElementById("statsParent").style.display = "block"
                setStatsTitle()
            }else{
                status("Incorrect password")
            } 
        })
    }else{
        status("Incorrect password")
    }
}

function logout(){
    loopingHistory = false
    player = ""
    privateKey = null
    resetStats()
    localStorage.removeItem("username")
    localStorage.removeItem("postingKey")
    document.getElementById("statsParent").style.display = "none"
    document.getElementById("loginBox").style.display = "block"
    document.getElementById("footer").style.display = "none"
}

function checkAuth(){
   let username = localStorage.getItem("username") 
   let postingKey = localStorage.getItem("postingKey")
   if(username !== null && postingKey !== null){
        document.getElementById("footer").style.display = "block"
        privateKey = dhive.PrivateKey.fromString(postingKey)
        player = username
        setStatsTitle()
        document.getElementById("loginBox").style.display = "none"
        document.getElementById("statsParent").style.display = "block"
   }
}

function status(text){
    document.getElementById("loginStatus").style.display = "block"
    document.getElementById("loginStatus").innerHTML = text
}

async function getBlocks(num){
    let mode = {mode:1}
    if(num !== null) mode = {mode:1,from:num}
    try{
        for await (const block of client.blockchain.getBlocks(mode)) {
            if(block !== null && block.transactions !== null && block.transactions.length > 0){
                let current = block.transactions[0].block_num
                nextBlock = ++current
                if(TESTING) console.log(`New block, id: ${current}`);
                checkForOps(block)
            }
        }
    }catch(e){
        console.log(e)
        setTimeout(function(){ getBlocks(nextBlock)},1500)
    }
}

function checkForOps(block){
    for(let tx of block.transactions){
        for(let operation of tx.operations){
            if(operation[0] == "custom_json"){
                let json = JSON.parse(operation[1].json)
                let author = operation[1].required_posting_auths[0]
                let id = operation[1].id
                if(author === serverAccount && id === appName){
                    if(json.hasOwnProperty("type") && json.type === "evaluation"){
                        if(!sending) backToDefault()
                        let guesses = json.guesses;
                        let id = json.gameId
                        for(guess of guesses){
                            let split = guess.split(",")
                            if(split.length >= 7){
                                let event = document.createElement("P")
                                let guesser = split[0]
                                let reputation = split[1]
                                let tokens = split[2]
                                let lives = split[3]
                                let reason = split[4]
                                let streak = split[5]
                                let rank = split[6]

                                if(reason === REASON_CORRECT && guesser === player){
                                    updateStats(id, reason,rank,tokens,lives,streak)
                                }else if(reason === REASON_WRONG && guesser === player){
                                    updateStats(id, reason,rank,tokens,lives,streak)
                                }else if(reason === REASON_INVALID && guesser === player){
                                    updateStats(id, reason,rank,tokens,lives,streak)
                                }
                                
                                if(reason === REASON_CORRECT){
                                    if(guesser === player) event.classList.add(REASON_CORRECT)
                                    event.innerHTML = guesser+" won Game #"+id+" [R:"+rank+", T:"+tokens+", L:"+lives+"]"
                                    gameHistory.prepend(event)
                                } 
                            }
                        }
                    }
                }
            }else if(operation[0] === "account_update2" && operation[1].account === serverAccount){
                let json = JSON.parse(operation[1].posting_json_metadata)
                if(json.hasOwnProperty("game")){
                    let game = json.game
                    let currentGame = game.gameId
                    if(currentGame !== gameId){
                        gameId = currentGame
                        currentGameDiv.innerHTML = "Current Game: "+currentGame
                        loadJigsaw(game)
                    }
                }
            }
        }
    }
}

function updateStats(id, reason, rank, tokens, lives, streak){
    let text = player+" "+reason+" Game #"+id
    rankDiv.innerHTML="Rank: "+rank
    tokensDiv.innerHTML="Tokens: "+tokens
    livesDiv.innerHTML="Lives: "+lives
    streakDiv.innerHTML="Streak: "+streak
    populateStats(text,reason)
}

function resetStats(){
    statsDiv.innerHTML = ""
    rankDiv.innerHTML="Rank: ?"
    tokensDiv.innerHTML="Tokens: ?"
    livesDiv.innerHTML="Lives: ?"
    streakDiv.innerHTML="Streak: ?"
}

checkAuth()
blockchain.getCurrentBlockNum().then(num => {
    console.log("Starting game at block "+num)
    getGame()
    sleep(250) //I want to make sure that getGame happens before getBlocks b/c the last game might be expired
    getBlocks(num)
})