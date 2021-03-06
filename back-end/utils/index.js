var jwt = require('jsonwebtoken')
var jwkToPem = require('jwk-to-pem')
var VisualRecognitionV3 = require('ibm-watson/visual-recognition/v3')
var { IamAuthenticator } = require('ibm-watson/auth')
var AWS = require('aws-sdk')
require('dotenv').config()

const visualRecognition = new VisualRecognitionV3({
  url: 'https://gateway.watsonplatform.net/visual-recognition/api',
  version: '2018-03-19',
  authenticator: new IamAuthenticator({ apikey: process.env.watson_token })
})

const classifierIds = process.env.classifier_ids ? process.env.classifier_ids.split(',') : null

const classify = function (imageBuffer) {
  return new Promise(function (resolve, reject) {
    console.log(classifierIds)
    visualRecognition.classify({
      imagesFile: imageBuffer,
      owners: ["me"]
    })
      .then(response => {

        console.log(response.result.images[0])
        const result = {
          species: response.result.images[0].classifiers[0].classes,
          disease: response.result.images[0].classifiers[1].classes
        }
        console.log(result.species)
        resolve(result)
      })
      .catch(err => {
        reject(err)
      })
  })
}

AWS.config.update(
  {
    accessKeyId: process.env.aws_s3_access_key_id,
    secretAccessKey: process.env.aws_s3_secret_access_key
  }
)

const s3 = new AWS.S3()

const getS3Object = function (key) {
  console.log(key)
  return new Promise((resolve, reject) => {
    s3.getObject({ Bucket: process.env.aws_s3_bucket, Key: key }, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}
const deleteS3Object = function (key) {
  console.log(key)
  return new Promise((resolve, reject) => {
    s3.deleteObject({ Bucket: process.env.aws_s3_bucket, Key: key }, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}
const uploadS3Object = function (key, obj) {
  return new Promise((resolve, reject) => {
    s3.putObject({ Bucket: process.env.aws_s3_bucket, Key: key, Body: obj }, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

function validateToken (req, res, next) {
  fetch(`${process.env.cognito_issuer}/${process.env.cognito_pool_id}/.well-known/jwks.json`)
    .then(res => {
      return res.json()
    })
    .then(body => {
      var pems = {}
      var keys = body.keys
      for (var i = 0; i < keys.length; i++) {
        var keyId = keys[i].kid
        var modulus = keys[i].n
        var exponent = keys[i].e
        var keyType = keys[i].kty
        var jwk = { kty: keyType, n: modulus, e: exponent }
        var pem = jwkToPem(jwk)
        pems[keyId] = pem
      }

      var decodedJwt = jwt.decode(req.headers.token, { complete: true })
      if (!decodedJwt) {
        return res.status(401).send('Not a valid jwt token!')
      }

      var kid = decodedJwt.header.kid
      pem = pems[kid]
      if (!pem) {
        return res.status(401).send('Invalid token')
      }

      jwt.verify(req.headers.token, pem, (err, payload) => {
        if (err) {
          return res.status(401).send('Invalid Token.')
        } else {
          res.locals.auth = payload
          next()
        }
      })
    })
    .catch(() => {
      return res.status(401).send('Error while validating token!')
    })
}

exports.validateToken = validateToken
exports.classify = classify
exports.getS3Object = getS3Object
exports.uploadS3Object = uploadS3Object
exports.deleteS3Object = deleteS3Object
