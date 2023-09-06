import axios from 'axios'
import * as cheerio from 'cheerio'
import { exec } from 'node:child_process'
import fs from 'node:fs'
import dotenv from 'dotenv'

interface IconContentObject {
  name: string
  content: string
}

const URL = 'https://exercism.org/tracks'
const ENV_PATH = `${process.cwd()}\\.env`
let htmlContext = ''
// 获取html内容
function getHtmlContext() {
  axios
    .get(URL, {
      headers: {
        Cookie: getEnvCookie(),
      },
    })
    .then(async (res) => {
      if (res.status === 200 && res.statusText === 'OK') {
        htmlContext = res.data
        const ICON_URL_LIST: Array<string> = getIconList()!
        const ICON_CONTENT: Array<IconContentObject> = []
        for (let i = 0; i < ICON_URL_LIST.length; i++) {
          let icon_prefix = ICON_URL_LIST[i].split('/').pop()!
          ICON_CONTENT.push({
            name: icon_prefix,
            content: await getIconContent(ICON_URL_LIST[i]),
          })
        }
        generateIconSvg(ICON_CONTENT)
      } else {
        console.log('获取失败')
      }
    })
}
// 根据url获取icon content
async function getIconContent(url: string) {
  const { data } = await axios.get(url)
  return data
}

// 从env文件获取cookie
function getEnvCookie() {
  const envConfig = fs.readFileSync(ENV_PATH, {
    encoding: 'utf-8',
  })
  const envObj = dotenv.parse(envConfig)
  return envObj.BASE_COOKIE
}

// 获取icon url列表
function getIconList() {
  const $ = cheerio.load(htmlContext)
  const tracks = $('.c-react-wrapper-student-tracks-list')
  if (!tracks.length) return
  const SOURCE_JSON = JSON.parse(tracks?.attr()?.['data-react-data']!)
  const trackList: Array<any> =
    SOURCE_JSON?.request?.options?.initialData?.tracks
  let iconList: Array<string> = trackList.map((item) => item.icon_url)
  return iconList
}

// 生成icon svg 文件
function generateIconSvg(iconContent: Array<IconContentObject>) {
  // 判断根目录下是否有icon文件夹
  if (fs.existsSync('icon')) {
    fs.rmSync('icon', { recursive: true })
  }

  fs.mkdir('icon', { recursive: true }, (error) => {
    if (!error) {
      iconContent.forEach((item, index) => {
        console.log(`正在写入第${index + 1}个文件，文件名： ${item.name}`)
        fs.writeFileSync(`icon/${item.name}`, item.content)
      })
    } else {
      throw new Error(error.message)
    }
  })
}

getHtmlContext()
