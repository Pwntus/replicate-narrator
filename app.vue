<template lang="pug">
#app.h-full
  main.container.mx-auto.p-2(
    class="lg:p-4"
  )
    .rounded-lg.bg-slate-700.text-neutral-50.p-2(
      class="lg:p-4"
    )
      span.font-bold Let famous people narrate your life! 
      | This work is based on open source machine leraning models. Idea + demo was originally created by Charlie Holtz: 
      a.text-neutral-300(
        class="hover:text-neutral-50"
        href="https://twitter.com/charliebholtz/status/1724815159590293764"
        target="_new"
      ) https://twitter.com/charliebholtz/status/1724815159590293764

    .grid.grid-cols-4.gap-2.content-center.my-2(
      class="lg:gap-4 lg:my-4"
    )
      a.rounded-lg.bg-amber-100.text-amber-950.text-center.font-medium.p-2(
        class="lg:p-4 hover:bg-amber-200"
        href="https://replicate.com/?utm_source=project&utm_campaign=narrator"
        target="_new"
      ) Replicate
      a.rounded-lg.bg-amber-100.text-amber-950.text-center.font-medium.p-2(
        class="lg:p-4 hover:bg-amber-200"
        href="https://replicate.com/yorickvp/llava-13b"
        target="_new"
      ) LLaVA 13B
      a.rounded-lg.bg-amber-100.text-amber-950.text-center.font-medium.p-2(
        class="lg:p-4 hover:bg-amber-200"
        href="https://replicate.com/lucataco/xtts-v2"
        target="_new"
      ) XTTS-v2
      a.rounded-lg.bg-amber-100.text-amber-950.text-center.font-medium.p-2(
        class="lg:p-4 hover:bg-amber-200"
        href="https://github.com/Pwntus/replicate-narrator/tree/main"
        target="_new"
      ) GitHub

    webcam(@data="onData")

    .grid.grid-cols-2.gap-2.content-center.mt-2(
      class="lg:gap-16 lg:mt-4"
    )
      select.rounded-lg.bg-slate-700.text-neutral-50(v-model="narrator")
        option(
          v-for="(item, index) in narrators"
          :key="`narrator-${index}`"
          :value="item.value"
        ) {{ item.text }}
      .text-3xl.font-medium.text-gray-800.self-center.justify-center.flex {{ state_text[state] }}
</template>

<script>
import rwp from 'replicate-webhook-proxy'

const makeid = (length) => {
  let result = ''
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  let counter = 0
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
    counter += 1
  }
  return result
}

const TICK_INTERVAL = 1000
const ws_id = makeid(10)
const client = rwp(ws_id)

export default {
  name: 'App',
  data: () => ({
    interval: null,

    /**
     * state:
     *  0 = ready
     *  1 = submitted image to create text (waiting)
     *  2 = submitted text to create audio (waiting)
     *  3 = audio is playing (wait until audio done)
     */
    state: 0,
    state_text: {
      0: '👀 watching',
      1: '👀 watching',
      2: '🧠 thinking...',
      3: '🎤 speaking'
    },
    // Used to countdown before resetting state when audio is playing
    countdown: 3,

    image: null,

    narrator: 'david',
    narrators: [
      { text: 'David Attenborough', value: 'david' },
      { text: 'Morgan Freeman', value: 'morgan' },
      { text: 'Louis Theroux', value: 'louis' },
      { text: 'Philomena Cunk', value: 'philomena' },
      { text: 'Ira Glass', value: 'ira' }
    ]
  }),
  methods: {
    // Tick is responsible for firing new observations if we're stuck/ready
    tick() {
      console.log('--- log: tick, state = ', this.state)
      if (this.state === 0) {
        this.countdown -= 1
        if (this.countdown <= 0) this.submit()
      }
      if (this.state === 3) {
        this.countdown -= 1
        if (this.countdown <= 0) {
          this.state = 0
          this.countdown = 3
        }
      }
    },
    onData(image) {
      this.image = image
    },
    async submit() {
      try {
        if (!this.image) return

        this.state = 1
        await fetch('/api/text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            narrator: this.narrator,
            image: this.image,
            ws_id
          })
        })
      } catch (e) {
        console.log('--- log: failed to call API:', e)
        this.state = 0
      }
    }
  },
  mounted() {
    this.interval = setInterval(() => this.tick(), TICK_INTERVAL)
    client.on('message', async (event) => {
      try {
        const { type, narrator } = event.data.query

        // We got a text response, send it further to synthesize an audio response
        if (type === 'text') {
          this.state = 2

          const text = event.data.body.output.join('')
          console.log(
            `--- log: got text response with narrator = ${narrator}: `,
            text
          )

          await fetch('/api/audio', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              narrator,
              text: text,
              ws_id
            })
          })
        }

        // We got the final audio, play it
        if (type === 'audio') {
          this.state = 3
          this.countdown = 30

          const { output } = event.data.body
          console.log(
            `--- log: got audio response with narrator = ${narrator}: `,
            output
          )

          const audio = new Audio(output)
          audio.play()
        }
      } catch (e) {
        console.log('--- log: failed to parse webhook:', e)
        this.state = 0
      }
    })
  },
  beforeUnmount() {
    if (this.interval) clearInterval(this.interval)
  }
}
</script>

<style lang="stylus" scoped>
#app
  nav
    background-color rgba(240, 240, 240, .8)
    -webkit-backdrop-filter saturate(180%) blur(20px)
    backdrop-filter saturate(180%) blur(20px)

    .router-link-active
      border-bottom 3px solid #92400e
      color #92400e

  select
    width 100%
    padding 15px
    display block
</style>
