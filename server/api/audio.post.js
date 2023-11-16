import Replicate from 'replicate'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
})

export default defineEventHandler(async (event) => {
  try {
    const { narrator, text, ws_id } = await readBody(event)
    console.log(`--- log: narrator = ${narrator}, text = ${text}`)

    // Load voice
    let voice = null
    let speaker = null
    if (narrator === 'david') voice = await import('./speakers/david')
    if (narrator === 'morgan') voice = await import('./speakers/morgan')
    if (narrator === 'louis') voice = await import('./speakers/louis')
    if (narrator === 'philomena') voice = await import('./speakers/philomena')
    if (!voice) throw new Error('narrator not found')
    speaker = voice.default

    let prediction
    const input = {
      text,
      speaker_wav: speaker,
      language: 'en'
    }

    if (process.env.REPLICATE_USE_DEPLOYMENT) {
      console.log(
        '--- log: creating xtts-v2 prediction to get the voice synthesis, using Replicate deployment'
      )
      prediction = await replicate.deployments.predictions.create(
        'replicate',
        'replicate-narrator',
        {
          input,
          webhook: `https://r3swiuknhh.execute-api.eu-west-1.amazonaws.com/prod/webhook?key=${ws_id}&narrator=${narrator}&type=audio`,
          webhook_events_filter: ['completed']
        }
      )
    } else {
      console.log(
        '--- log: creating xtts-v2 prediction to get the voice synthesis'
      )
      prediction = await replicate.predictions.create({
        // lucataco/xtts-v2
        version:
          '448485e6a4335b184c22e51e699e251bb3c03bc247cd25beee92017af6a08cbd',
        input,
        webhook: `https://r3swiuknhh.execute-api.eu-west-1.amazonaws.com/prod/webhook?key=${ws_id}&narrator=${narrator}&type=audio`,
        webhook_events_filter: ['completed']
      })
    }
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
