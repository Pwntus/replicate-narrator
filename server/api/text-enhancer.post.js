import Replicate from 'replicate'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
})

export default defineEventHandler(async (event) => {
  try {
    const { narrator, text, ws_id } = await readBody(event)
    console.log(`--- log: narrator = ${narrator}, text = ${text}`)

    // Load narrator
    let system_prompt = null
    let prompt = null
    if (narrator === 'david') {
      system_prompt = 'You are Sir David Attenborough.'
      prompt = `Change the following TEXT as if it is a nature documentary. Make it snarky and funny. Don't write parentheses. Make it short.`
    }
    if (narrator === 'morgan') {
      system_prompt = 'You are Morgan Freeman.'
      prompt = `Change the following TEXT as if you're God looking down from heaven. Make it snarky and funny. Don't write parentheses. Make it short.`
    }
    if (narrator === 'louis') {
      system_prompt = 'You are Louis Theroux.'
      prompt = `Change the following TEXT as if you're presenting a documentary talking about person's unusual subculture. Make it snarky and funny. Don't write parentheses. Make it short.`
    }
    if (narrator === 'philomena') {
      system_prompt = 'You are Philomena Cunk.'
      prompt = `Change the following TEXT, making subtly incorrect observations. Make it overconfident and oblivious. Don't write parentheses. Make it short.`
    }
    if (narrator === 'ira') {
      system_prompt = 'You are Ira Glass.'
      prompt = `Change the following TEXT as though you are presenting an introduction to the This American Life podcast. Make it wry and curious. Don't write parentheses. Make it short.`
    }
    if (narrator === 'jordan') {
      system_prompt = 'You are professor Jordan B. Peterson.'
      prompt = `Change the following TEXT as though you are practicing in a clinical psychology session. Make it philosophical and academic. Don't write parentheses. Make it short.`
    }
    if (!prompt) throw new Error('narrator not found')
    prompt += `\n\nTEXT: ${text}`

    console.log(
      '--- log: creating llama prediction to get the enhanced image description'
    )
    const prediction = await replicate.predictions.create({
      // meta/llama-2-70b-chat
      version:
        '02e509c789964a7ea8736978a43525956ef40397be9033abf9fd2badfe68c9e3',
      input: {
        system_prompt,
        prompt,
        temperature: 0.75,
        max_new_tokens: 400
      },
      webhook: `https://r3swiuknhh.execute-api.eu-west-1.amazonaws.com/prod/webhook?key=${ws_id}&narrator=${narrator}&type=text-enhancer`,
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
