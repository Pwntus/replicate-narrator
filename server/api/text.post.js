import Replicate from 'replicate'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
})

export default defineEventHandler(async (event) => {
  try {
    const { narrator, image, ws_id } = await readBody(event)
    console.log(`--- log: narrator = ${narrator}, image = <data>`)

    // Load narrator
    let prompt = null
    if (narrator === 'david')
      prompt = `You are Sir David Attenborough. Narrate the picture of the human as if it is a nature documentary. Make it snarky and funny. Don't repeat yourself. Make it short. If I do anything remotely interesting, make a big deal about it!`
    if (narrator === 'morgan')
      prompt = `You are Morgan Freeman. Narrate the picture of the human as if you're God looking down from heaven. Make it snarky and funny. Don't repeat yourself. Make it short. If I do anything remotely interesting, make a big deal about it!`
    if (narrator === 'louis')
      prompt = `You are Louis Theroux. Narrate the picture of the human as if you're presenting a documentary talking about person's unusual subculture. Make it snarky and funny. Don't repeat yourself. Make it short. If I do anything remotely interesting, make a big deal about it!`
    if (narrator === 'philomena')
      prompt = `You are Philomena Cunk. Narrate the picture of the human, making subtly incorrect observations. Make it overconfident and oblivious. Don't repeat yourself. Make it short. If I do anything remotely interesting, make a big deal about it!`
    if (narrator === 'ira')
      prompt = `You are Ira Glass. Narrate the picture of the human as though you are presenting an introduction to the This American Life podcast. Make it wry and curious. Don't repeat yourself. Make it short. If I do anything remotely interesting, make a big deal about it!`
    if (!prompt) throw new Error('narrator not found')

    console.log(
      '--- log: creating llava prediction to get the image description'
    )
    const prediction = await replicate.predictions.create({
      // yorickvp/llava-13b
      version:
        '2facb4a474a0462c15041b78b1ad70952ea46b5ec6ad29583c0b29dbd4249591',
      input: {
        image,
        prompt,
        temperature: 0.75,
        max_tokens: 400
      },
      webhook: `https://r3swiuknhh.execute-api.eu-west-1.amazonaws.com/prod/webhook?key=${ws_id}&narrator=${narrator}&type=text`,
      webhook_events_filter: ['completed']
    })
    console.log('--- info: creating prediction... DONE!')

    return prediction
  } catch (e) {
    console.log('--- error: ', e)

    throw createError({
      statusCode: 500,
      statusMessage: 'Something went wrong with the API request.'
    })
  }
})
