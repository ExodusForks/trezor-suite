# @exodus/trezor-transport

[![NPM](https://img.shields.io/npm/v/@exodus/trezor-transport.svg)](https://www.npmjs.org/package/@exodus/trezor-transport)

Library for low-level communication with Trezor.

Intended as a "building block" for other packages - it is used in ~~trezor.js~~ (deprecated) and [@trezor/connect](https://github.com/trezor/trezor-suite/tree/develop/packages/connect).

_You probably don't want to use this package directly._ For communication with Trezor via a more high-level API, use [@trezor/connect](https://github.com/trezor/trezor-suite/tree/develop/packages/connect).

## What is the purpose

- translate JSON payloads to binary messages using [protobuf definitions](https://github.com/trezor/trezor-common/tree/master/protob) comprehensible to Trezor devices
- chunking and reading chunked messages according to the [Trezor protocol](https://github.com/trezor/trezor-common/blob/master/protob/protocol.md)
- exposing single API for various transport methods:
    - Trezor Bridge
    - WebUSB

## Environments and sessions

The default entry exports WebUSB and Bridge implementations that can also be loaded by
an unbundled Electron renderer. It does not load Node's UDP implementation. Node emulator
clients that need UDP should import `UdpTransport` from
`@exodus/trezor-transport/lib/transports/udp`. React Native continues to use the WebUSB stub;
native USB and Bluetooth implementations can use the shared transport base classes.

WebUSB uses local sessions by default. To coordinate sessions across browser tabs, deploy
the sessions SharedWorker and pass its URL as `sessionsBackgroundUrl` when constructing
`WebUsbTransport`. The transport does not probe for a worker when this option is omitted.
If an explicitly configured worker cannot be loaded, it falls back to local sessions.

## Publishing

This package is published to npm registry because it is a dependency of [@trezor/connect](https://github.com/trezor/trezor-suite/issues/5440) which can be installed as a standalone package.

[Follow instructions](../../docs/releases/npm-packages.md) how to publish @trezor package to npm registry.
