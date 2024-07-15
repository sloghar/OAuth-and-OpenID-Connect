import express, { response } from 'express'
import querystring from 'node:querystring'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import ejs from 'ejs'

dotenv.config()

const app = express()

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(cookieParser())

app.get('/home', async (req, res) => {
  const GITHUB_USER_DATA_URL = 'https://api.github.com/user'
  const { access_token } = req.cookies

  if (!access_token) {
    res.redirect('/api/login')
    res.end()
  }

  const options = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  }

  const response = await fetch(GITHUB_USER_DATA_URL, options)
  const data = await response.json()
  const { name, avatar_url: avatar, location, url } = data
  res.render('home', {
    user: {
      name,
      avatar,
      location,
      url
    }
  })
})

app.get('/api/login', (req, res) => {
  const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize'

  const scopes = [
    'public_repo',
    'read:user',
    'user:email'
  ]

  const query = querystring.stringify({
    client_id: process.env.CLIENT_ID,
    redirect_uri: process.env.REDIRECT_URI,
    scope: scopes.join(' ')
  })

  res.redirect(`${GITHUB_AUTH_URL}?${query}`)
  res.end()
})

app.get('/api/callback', async (req, res) => {
  const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'
  const { code } = req.query

  const query = querystring.stringify({
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    code,
    redirect_uri: process.env.REDIRECT_URI
  })

  const options = {
    method: 'POST',
    headers: {
      Accept: 'application/json'
    }
  }

  const response = await fetch(`${GITHUB_TOKEN_URL}?${query}`, options)
  const json = await response.json()

  const { access_token } = json

  res.setHeader('Set-Cookie', `access_token=${access_token}; Path=/; HttpOnly;`)
  res.redirect('/home')
  res.end()
})

app.listen(process.env.PORT, () => {
  console.log(`Server listening on http://localhost:${process.env.PORT}`)
})
