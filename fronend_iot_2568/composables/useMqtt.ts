import { ref, reactive } from 'vue'
import mqtt, { MqttClient } from 'mqtt'

export const useMqtt = () => {
  const client = ref<MqttClient | null>(null)
  const status = ref('Disconnected')
  
  const stats = reactive({
    voltage: '0.000',
    current: '0.000',
    power: '0.000',
    energy: '0.000',
    frequency: '0.000',
    powerFactor: '0.000'
  })

  const MQTT_CONFIG = {
    hostname: '192.168.30.67',
    port: 9001,
    username: '',
    password: '',
    clientId: `mqttjs_${Math.random().toString(16).substr(2, 8)}`,
    keepalive: 60,
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000
  }

  const topics = {
    voltage: 'sensor/voltage',
    current: 'sensor/current',
    power: 'sensor/power',
    energy: 'sensor/energy',
    frequency: 'sensor/frequency',
    powerFactor: 'sensor/pf'
  }

  const connect = () => {
    try {
      const wsUrl = `ws://${MQTT_CONFIG.hostname}:${MQTT_CONFIG.port}/mqtt`
      
      console.log('Connecting to MQTT broker:', wsUrl)
      
      client.value = mqtt.connect(wsUrl, {
        ...MQTT_CONFIG,
        protocol: 'ws' as 'ws',
        will: {
          topic: 'client/status',
          payload: Buffer.from('offline'),
          qos: 1,
          retain: false
        }
      })

      client.value.on('connect', () => {
        console.log('Connected to MQTT broker')
        status.value = 'Connected'

        Object.values(topics).forEach(topic => {
          client.value?.subscribe(topic, { qos: 1 }, (err) => {
            if (err) {
              console.error(`Failed to subscribe to ${topic}:`, err)
            } else {
              console.log(`Subscribed to ${topic}`)
            }
          })
        })
      })

      client.value.on('message', (topic, message) => {
        try {
          const value = message.toString()
          console.log(`Received ${topic}:`, value)

          switch (topic) {
            case topics.voltage:
              stats.voltage = parseFloat(value).toFixed(2)
              break
            case topics.current:
              stats.current = parseFloat(value).toFixed(2)
              break
            case topics.power:
              stats.power = parseFloat(value).toFixed(2)
              break
            case topics.energy:
              stats.energy = parseFloat(value).toFixed(3)
              break
            case topics.frequency:
              stats.frequency = parseFloat(value).toFixed(1)
              break
            case topics.powerFactor:
              stats.powerFactor = parseFloat(value).toFixed(2)
              break
          }
        } catch (error) {
          console.error('Error processing message:', error)
        }
      })

      client.value.on('error', (error) => {
        console.error('MQTT Connection Error:', error)
        status.value = 'Connection Error'
      })

      client.value.on('offline', () => {
        console.log('MQTT Client Offline')
        status.value = 'Offline'
      })

      client.value.on('reconnect', () => {
        console.log('Attempting to reconnect...')
        status.value = 'Reconnecting'
      })

    } catch (error) {
      console.error('MQTT Connection Error:', error)
      status.value = 'Connection Error'
    }
  }

  const disconnect = () => {
    if (client.value && client.value.connected) {
      client.value.end()
      client.value = null
      status.value = 'Disconnected'
    }
  }

  return {
    connect,
    disconnect,
    status,
    stats
  }
}