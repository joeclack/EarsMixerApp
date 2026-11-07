Pod::Spec.new do |s|
  s.name = 'EarsMixerDiscovery'
  s.version = '1.0.0'
  s.summary = 'Native Bonjour discovery for EarsMixer'
  s.description = s.summary
  s.license = 'MIT'
  s.author = 'Joe Clack'
  s.homepage = 'https://github.com/joeclack/EarsMixerApp'
  s.source = { git: 'https://github.com/joeclack/EarsMixerApp.git' }
  s.platforms = { :ios => '16.4' }
  s.swift_version = '5.9'
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.swift'
end
