import ExpoModulesCore
import Foundation
import Darwin

public class EarsMixerDiscoveryModule: Module {
  private var discovery: MixerBrowser?

  public func definition() -> ModuleDefinition {
    Name("EarsMixerDiscovery")
    Events("onFound", "onLost", "onError")
    AsyncFunction("start") {
      self.discovery?.stop()
      let discovery = MixerBrowser { [weak self] event, payload in
        self?.sendEvent(event, payload)
      }
      self.discovery = discovery
      discovery.start()
    }.runOnQueue(.main)
    AsyncFunction("stop") {
      self.discovery?.stop()
      self.discovery = nil
    }.runOnQueue(.main)
    OnDestroy {
      let discovery = self.discovery
      DispatchQueue.main.async { discovery?.stop() }
    }
  }
}

// Foundation browses and resolves Bonjour on the main run loop. Retain each
// service until resolution finishes; otherwise delegate callbacks never arrive.
private final class MixerBrowser: NSObject, NetServiceBrowserDelegate, NetServiceDelegate {
  private let browser = NetServiceBrowser()
  private var services: [String: NetService] = [:]
  private var active = false
  private let emit: (String, [String: Any]) -> Void

  init(emit: @escaping (String, [String: Any]) -> Void) { self.emit = emit }
  func start() {
    active = true
    browser.delegate = self
    browser.searchForServices(ofType: "_earsmixer._tcp.", inDomain: "local.")
  }
  func stop() {
    active = false
    browser.delegate = nil
    browser.stop()
    for service in services.values { service.delegate = nil; service.stop() }
    services.removeAll()
  }
  private func key(_ service: NetService) -> String { service.name + "." + service.type + service.domain }

  func netServiceBrowser(_ browser: NetServiceBrowser, didFind service: NetService, moreComing: Bool) {
    guard active else { return }
    let id = key(service)
    services[id]?.stop()
    services[id] = service
    service.delegate = self
    service.resolve(withTimeout: 8)
  }
  func netServiceBrowser(_ browser: NetServiceBrowser, didRemove service: NetService, moreComing: Bool) {
    guard active else { return }
    let id = key(service)
    services.removeValue(forKey: id)?.stop()
    emit("onLost", ["id": id])
  }
  func netServiceBrowser(_ browser: NetServiceBrowser, didNotSearch errorDict: [String: NSNumber]) {
    guard active else { return }
    let code = errorDict[NetService.errorCode]?.intValue ?? 0
    let message = code == -72008
      ? "Allow Local Network access for EarsMixer in iOS Settings, then try again."
      : "Nearby mixers could not be found. Check Local Network access in iOS Settings and try again."
    emit("onError", ["message": message])
    stop()
  }
  func netServiceDidResolveAddress(_ service: NetService) {
    guard active, services[key(service)] === service else { return }
    // The HTTP listener advertises IPv4. Use resolved addresses, not the server's
    // custom QR URL, which may point to an unreachable adapter or external DNS.
    let addresses: [String] = (service.addresses ?? []).compactMap { data in
      data.withUnsafeBytes { bytes -> String? in
        guard let raw = bytes.baseAddress, data.count >= MemoryLayout<sockaddr_in>.size else { return nil }
        let address = raw.assumingMemoryBound(to: sockaddr.self)
        guard address.pointee.sa_family == sa_family_t(AF_INET) else { return nil }
        var host = [CChar](repeating: 0, count: Int(NI_MAXHOST))
        guard getnameinfo(address, socklen_t(data.count), &host, socklen_t(host.count), nil, 0, NI_NUMERICHOST) == 0 else { return nil }
        return String(cString: host)
      }
    }
    emit("onFound", ["id": key(service), "name": service.name, "addresses": addresses, "port": service.port])
  }
  func netService(_ service: NetService, didNotResolve errorDict: [String: NSNumber]) {
    // An individual server can disappear while resolving. Leave other results
    // visible; a new browse (or service announcement) retries it.
    if services[key(service)] === service { services.removeValue(forKey: key(service)) }
  }
}
