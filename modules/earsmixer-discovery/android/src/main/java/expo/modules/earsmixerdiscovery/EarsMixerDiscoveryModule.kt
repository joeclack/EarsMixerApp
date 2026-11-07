package expo.modules.earsmixerdiscovery

import android.content.Context
import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo
import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class EarsMixerDiscoveryModule : Module() {
  private val main = Handler(Looper.getMainLooper())
  private var browser: MixerBrowser? = null

  override fun definition() = ModuleDefinition {
    Name("EarsMixerDiscovery")
    Events("onFound", "onLost", "onError")
    AsyncFunction("start") {
      main.post {
        browser?.stop()
        val context = appContext.reactContext
        if (context == null) {
          sendEvent("onError", mapOf("message" to "Nearby mixers are unavailable. Try again."))
        } else {
          browser = MixerBrowser(context) { event, payload -> sendEvent(event, payload) }
          browser?.start()
        }
      }
      Unit
    }
    AsyncFunction("stop") { main.post { browser?.stop(); browser = null }; Unit }
    OnDestroy { main.post { browser?.stop(); browser = null } }
  }
}

@Suppress("DEPRECATION") // The listener API also supports devices below Android 13.
private class MixerBrowser(context: Context, val emit: (String, Map<String, Any>) -> Unit) {
  private val manager = context.getSystemService(Context.NSD_SERVICE) as NsdManager
  private val main = Handler(Looper.getMainLooper())
  private var active = false
  private var registered = false
  private var resolving = false
  private val services = mutableMapOf<String, NsdServiceInfo>()
  private val queue = ArrayDeque<NsdServiceInfo>()
  private fun key(info: NsdServiceInfo) = info.serviceName + "." + info.serviceType
  private fun post(action: () -> Unit) { main.post { if (active) action() } }

  private val listener = object : NsdManager.DiscoveryListener {
    override fun onDiscoveryStarted(type: String) {}
    override fun onDiscoveryStopped(type: String) {}
    override fun onStartDiscoveryFailed(type: String, code: Int) = post {
      registered = false
      fail()
    }
    override fun onStopDiscoveryFailed(type: String, code: Int) {}
    override fun onServiceFound(info: NsdServiceInfo) = post {
      services[key(info)] = info
      queue.addLast(info)
      resolveNext()
    }
    override fun onServiceLost(info: NsdServiceInfo) = post {
      services.remove(key(info))
      emit("onLost", mapOf("id" to key(info)))
    }
  }
  fun start() {
    active = true
    try {
      manager.discoverServices("_earsmixer._tcp.", NsdManager.PROTOCOL_DNS_SD, listener)
      registered = true
    } catch (_: Exception) { fail() }
  }
  fun stop() {
    active = false
    queue.clear()
    services.clear()
    if (registered) {
      registered = false
      try { manager.stopServiceDiscovery(listener) } catch (_: Exception) {}
    }
  }
  private fun fail() {
    emit("onError", mapOf("message" to "Nearby mixers are unavailable. Check your Wi-Fi and network permissions, then try again."))
    stop()
  }
  private fun resolveNext() {
    if (!active || resolving) return
    var info = queue.removeFirstOrNull() ?: return
    while (services[key(info)] !== info) { info = queue.removeFirstOrNull() ?: return }
    val candidate = info
    resolving = true
    try {
      manager.resolveService(candidate, object : NsdManager.ResolveListener {
        override fun onResolveFailed(service: NsdServiceInfo, code: Int) = post {
          resolving = false
          resolveNext()
        }
        override fun onServiceResolved(service: NsdServiceInfo) = post {
          resolving = false
          if (services[key(candidate)] === candidate) {
            val host = service.host?.hostAddress
            emit("onFound", mapOf("id" to key(candidate), "name" to service.serviceName,
              "addresses" to listOfNotNull(host), "port" to service.port))
          }
          resolveNext()
        }
      })
    } catch (_: Exception) { resolving = false; resolveNext() }
  }
}
