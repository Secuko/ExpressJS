const express = require('express')
const PORT = process.env.PORT || 3001
const path = require('path')
const mysql = require('mysql2')
//библиотека для создания id
const { v4 } = require('uuid')
const app = express()

//нужно для того чтобы работать с request
app.use(express.json())

class User {
    id;
    name;
    email;
    city;
    hobby;
    password;
    profile_pic;
    constructor(uId, uName, uEmail, uPassword, uCity, uHobby, uProfile_pic) {
        this.id = uId;
        this.name = uName;
        this.email = uEmail;
        this.password = uPassword;
        this.city = uCity;
        this.hobby = uHobby;
        this.profile_pic = uProfile_pic;
    }
    print() {
        console.log(`Name: ${this.name}  Age: ${this.age}`);
    }
}

const pool = mysql.createConnection({
    client: 'mysql2',
    host: process.env.HOST,
    user: 'root',
    password: 'pass',
    database: 'todolist'
}).promise()


async function getUsers() {
    const [rows] = await pool.query("SELECT * FROM Users")
    // const rows = result[0]
    console.log(rows)
    return rows
}

async function getUser(id) {
    const [rows] = await pool.query(`SELECT * FROM Users WHERE Users.id = ?`, [id])
    // console.log(rows[0])
    return rows[0]
}

async function checkCorrectEmail(email) {
    const rows = await pool.query(`SELECT * FROM Users WHERE Users.email = ? LIMIT 1`, [email])
    console.log(rows[0])
    if (typeof rows[0] == 'undefined' || rows[0].length > 0) {
        console.log(`User with email ${email} already exists`)
        return false;
    } else {
        console.log(`There is no user with email ${email}`)
        return true;
    }
}

async function checkCorrectName(name) {
    const rows = await pool.query(`SELECT * FROM Users WHERE Users.name = ? LIMIT 1`, [name])
    if (typeof rows[0] == 'undefined' || rows[0].length > 0) {
        console.log(`User with name ${name} already exists`)
        return false;
    } else {
        console.log(`There is no user with name ${name}`)
        return true;
    }
}

async function loginUser(name,password) {
    if ( !(await checkCorrectName(name))) {
        const [pass] = await pool.query(`SELECT Users.password FROM Users WHERE Users.name = ? LIMIT 1`, [name])

        console.log(pass[0].password)
        if (pass[0].password == password){
            console.log('Successful login')
            return true
        }
        console.log('Incorrect password')
        return false
    }
    console.log(`There is no user with name ${name}`)
    return false
}

async function createUser(user) {
    if (await checkCorrectEmail(user.email) && await checkCorrectName(user.name)) {
        const [result] = await pool.query(`INSERT INTO Users (name,email,password,city,hobby,profile_pic) VALUES (?,?,?,?,?,?)`,
            [user.name, user.email, user.password, user.city, user.hobby, user.profile_pic]
        )
        console.log(result)
        const id = result.insertId
        console.log(id)
        return getUser(id)
    } else {
        console.log('This user already exists')
        return null;
    }
}

// loginUser('Artem','password')


// checkCorrectEmail('sasha2@mail.ru')
// checkCorrectName('sasha2')

// const user = new User(1,'Sasha2','sasha2@mail.ru','ivan123','kovrov','singing',null)
// createUser(user)

// const users = getUsers()
// getUsers()
// getUser(1)


// connection.connect(function (err) {
//     if (err) {
//         console.error('error connecting: ' + err.stack);
//         return;
//     }

//     console.log('connected as id ' + connection.threadId);
// });

//получение списка пользователей
app.get('/admin/users', async (req, res)=>{
    const users = await getUsers()
    res.status(201).send(users)
})

//данные профиля
app.post('/user/:id', async (req, res)=>{
    const id = req.params.id;
    const user = await getUser(id)
    res.status(201).send(user)
})

//регистрация
app.post('/registration', async (req, res)=>{
    const {name,email,password} = req.body
    const user = await createUser(new User(1,name,email,password,'','',''))
    if (user == null){
        const message = {message : 'This user already exists'}
        res.status(201).send(message)
    } else {
        console.log(user)
        res.status(201).send(user)
    }
})

//авторизация
app.post('/login', async (req, res)=>{
    const {name,password} = req.body
    const status = await loginUser(name,password)
    console.log(status)
    if(status){
        const message = {message : 'Succsesful login'}
        res.status(201).send(message)
    } else {
        const message = {message : 'Failed login'}
        res.status(201).send(message)
    }
})


// app.get('*', (req, res) => {
//     res.sendFile(path.resolve(__dirname, 'client', 'index.html'))
// })

app.listen(PORT, () => console.log('Server has been started on port 3001...'))
