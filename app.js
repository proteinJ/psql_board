const express = require('express');
const app = express();
const ejs = require("ejs");
const bodyParser = require("body-parser");
const db = require("./config/pgConnect");
const session = require("express-session");

// express 애플리케이션에서 json 형태의 요청 body를 파싱하기 위해 사용되는 미들웨어
app.use(express.json()); 

// 정적 파일 서빙
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({extended: false}))

// express-session
app.use(session({ secret: 'unidago', cookie: {maxAge: 60000 }, resave:true, saveUninitialized: true}))

app.use((req, res, next) => {
    
    res.locals.user_id = "";
    res.locals.name = "";
    res.locals.idx = 1;

    if(req.session.member){
        res.locals.user_id = req.session.member.user_id
        res.locals.name = req.session.member.name
        res.locals.idx = req.session.member.idx
    }

    next()
})


// EJS 엔진 설정
app.set('view engine', 'ejs')
app.set('views', './views')

// const query = {
//     text: "INSERT INTO contactlist (name, email, memo) VALUES('jaehyun', 'wow@naver.com', '저는 메모입니다.')",
//   };
//   client
//     .query(query)
//     .then((res) => {
//       console.log(res);
//       client.end();
//     })
//     .catch((e) => console.error(e.stack));

// 라우터
app.get('/', (req,res) => {
    console.log(req.session.member);
    res.render('home');
})

app.get('/profile', (req,res) => {
    res.render('profile');
})

app.get('/map', (req,res) => {
    res.render('map');
})

app.get('/contact', (req,res) => {
    res.render('contact');
})

app.get('/board', (req,res) => {
    res.render('board');

})


// 문의하기
app.post('/contactProc', async (req,res) => {

    const name = req.body.name;
    const phone = req.body.phone;
    const email = req.body.email;
    const memo = req.body.memo;

    const query = {
        text: "INSERT INTO contactlist (name, phone, email, memo) VALUES($1, $2, $3, $4)",
        values : [name, phone, email, memo],
    };

    let client;

    try{
        client = await db.getConnection();
        await client.query(query);
        console.log("[ Server ] : ✅ DB에 데이터 저장 성공 !");
        res.send("<script> alert('문의사항이 등록되었습니다.'); location.href='/';</script>");
    } catch(err) {
        console.log("[ Server ] : ❌ DB에 데이터 저장 실패 ! ");
        console.error(err.stack);
    } finally {
        if (client) {
            db.closeConnection(client);
            console.log("DB 연결 종료")
        }
    }
    });

// 문의 받은 내용들 삭제
app.get('/contactDelete', async (req,res) => {
    const id = req.query.id
    const sql = `DELETE FROM contactlist where id='${id}' `

    let client;

    try{
        client = await db.getConnection();
        await client.query(sql);
        console.log("[ Server ] : ✅ DB에 데이터 삭제 성공 !");
        res.send("<script> alert('문의사항이 삭제되었습니다.'); location.href='/contactList';</script>");
    } catch(err) {
        console.log("[ Server ] : ❌ DB에 데이터 저장 실패 ! ")
        console.error(err.stack)
    } finally {
        if (client) {
            db.closeConnection(client);
            console.log("DB 연결 종료")
        }
    }
})


// 문의 받은 내용들 보기
app.get('/contactList', async (req,res) => {

    const query = "SELECT * FROM contactlist ORDER BY id DESC";

    let client;

    try{
        client = await db.getConnection();
        const result = await client.query(query);
        console.log("[ Server ] : ✅ DB의의 데이터 SELECT 성공 !");

        // 데이터 렌더링
        res.render('contactList', { lists: result.rows })
    } catch (err) {
        console.log("[ Server ] : ❌ DB 조회 중 에러 발생생 ! ")
        res.status(500).send('Error fethcing data from the database')
    } finally {
        if (client) {
            db.closeConnection(client);
            console.log("DB 연결 종료")
        }
    }
})

// 로그인
app.get('/login', (req,res) => {
    res.render('login');
})



app.post('/loginProc', async(req,res) => {

    const user_id = req.body.user_id;
    const pw = req.body.pw;
    
    
    const query = {
        text: "SELECT * FROM member WHERE user_id=$1 and pw=$2",
        values : [user_id, pw],
    };

    let client;

    try{
        client = await db.getConnection();
        const result = await client.query(query);
        if (result.rows.length == 0) {
            res.send("<script> alert('존재하지 않는 아이디 입니다.'); location .href='/login'; </script>")
        } else {
        console.log(result.rows[0]);

        req.session.member = result.rows[0]

        res.send("<script> alert('로그인 되었습니다.'); location .href='/'; </script>");
        }
        
        console.log("[ Server ] : ✅ DB에 데이터 찾아서 가져오기 성공 !");
    } catch(err) {
        console.log("[ Server ] : ❌ DB에 데이터 찾아서 가져오기 실패! ");
        console.error(err.stack);
    } finally {
        if (client) {
            db.closeConnection(client);
            console.log("DB 연결 종료")
        }
    }
    });

    app.get('/logout', async(req,res) => {

        req.session.member = null;
        res.send("<script> alert('로그아웃 되었습니다.'); location.href='/'; </script>")
       
        });


// 게시글 등록 ( 정보 받아와서 띄우기 )
app.post('/boardProc', async (req,res) => {

    const name = req.body.name;
    const title = req.body.title;
    const memo = req.body.memo;

    const query = {
        text: "INSERT INTO board (name, title, memo) VALUES($1, $2, $3)",
        values : [name, title, memo],
    };

    let client;

    try{
        client = await db.getConnection();
        await client.query(query);
        console.log("[ Server ] : ✅ DB에 데이터 저장 성공 !");
        res.send("<script> alert('글 작성 완료!'); location.href='/';</script>");
    } catch(err) {
        console.log("[ Server ] : ❌ DB에 데이터 저장 실패 ! ");
        console.error(err.stack);
    } finally {
        if (client) {
            db.closeConnection(client);
            console.log("DB 연결 종료")
        }
    }
    });

app.get('/boardList', async (req,res) => {

    const query = "SELECT * FROM board ORDER BY id DESC";

    let client;

    try{
        client = await db.getConnection();
        const result = await client.query(query);
        console.log("[ Server ] : ✅ DB의의 데이터 SELECT 성공 !");

        // 데이터 렌더링
        res.render('boardList', { lists: result.rows })
    } catch (err) {
        console.log("[ Server ] : ❌ DB 조회 중 에러 발생생 ! ")
        res.status(500).send('Error fethcing data from the database')
    } finally {
        if (client) {
            db.closeConnection(client);
            console.log("DB 연결 종료")
        }
    }
})













const PORT = 8001;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})

