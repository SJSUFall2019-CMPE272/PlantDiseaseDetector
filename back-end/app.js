var express = require('express')
var bodyParser = require('body-parser')
var logger = require('morgan')
// var indexRouter = require('./routes/index')
var uploadRouter = require('./routes/upload')
var authRouter = require('./routes/auth')
var testRouter = require('./routes/test')
// var validateToken = require('./utils/index').validateToken
global.fetch = require('node-fetch')

var app = express()
const port = process.env.PORT || 3000

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))

app.use('/upload', uploadRouter)
app.use('/test', testRouter)
app.use('/auth', authRouter)

// TODO: to implement a protected route, use the validateToken middleware
// app.use('/', validateToken, indexRouter)

app.listen(port, function () {
  console.log(`App listening on port ${port}!`)
})
