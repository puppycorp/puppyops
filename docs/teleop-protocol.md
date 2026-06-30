# PuppyOps Teleop Protocol

Status: draft v0.1

This document defines the protocol between PuppyOps and a robot agent during a
live teleoperation session. It covers operator authority, command messages,
robot telemetry, media stream negotiation, safety behavior, and timing
requirements.

## Goals

- Keep teleop responsive under normal Wi-Fi latency.
- Make command expiry and fail-safe behavior explicit.
- Allow the dashboard to display robot state without coupling to one robot
  model.
- Keep the message layer independent from the transport.
- Support future binary encodings without changing message semantics.

## Non-Goals

- This is not the fleet-management protocol for registration, provisioning, or
  OTA updates.
- This is not the dataset recording format.
- This does not define low-level motor controller packets inside the robot.
- This does not require ROS, although a robot agent may bridge these messages to
  ROS topics internally.

## Transport Profile

The protocol is defined at the message layer. The initial PuppyOps transport
profile is:

- Control and telemetry: WebSocket over TLS.
- Encoding: JSON UTF-8 text frames.
- Media: WebRTC RTP/SRTP for camera, depth, and microphone streams.
- Media signaling: protocol messages over the control WebSocket.
- Authentication: short-lived operator token passed during session open.

Recommended endpoint:

```text
wss://<robot-host>/puppyops/teleop/v1
```

Raw teleop commands must not be sent over an unauthenticated or unencrypted
connection outside a closed development bench.

## Roles

- `puppyops`: the operator UI/backend initiating a teleop session.
- `robot_agent`: the process running on or near the robot that owns the robot
  hardware interface.
- `operator`: the authenticated human controlling the session.

Only one operator may hold the active teleop lease for a robot at a time.
Observers may receive telemetry and media but must not send motion commands.

## Envelope

Every message uses the same top-level envelope.

```json
{
  "proto": "puppyops.teleop.v1",
  "type": "cmd.velocity",
  "msg_id": "01J2Y9R5PZ2A0TRZ1MT0BM6N4R",
  "session_id": "tel_01J2Y9QC9E2Y4SEZQKK71WS34W",
  "robot_id": "PuppyBot-X1",
  "seq": 42,
  "sent_at": "2026-06-26T09:12:33.125Z",
  "expires_at": "2026-06-26T09:12:33.325Z",
  "body": {}
}
```

Fields:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `proto` | string | yes | Protocol version. Must be `puppyops.teleop.v1` for this draft. |
| `type` | string | yes | Message type. |
| `msg_id` | string | yes | Unique message id. ULID or UUID is acceptable. |
| `session_id` | string | no | Present after a session is accepted. |
| `robot_id` | string | yes | Stable robot id known to PuppyOps. |
| `seq` | integer | yes | Monotonic sequence number per sender per session. |
| `sent_at` | string | yes | UTC RFC 3339 timestamp. |
| `expires_at` | string | no | UTC RFC 3339 timestamp after which the robot must ignore the message. |
| `body` | object | yes | Type-specific payload. |

Receivers must reject messages with an unsupported `proto`, missing required
fields, malformed timestamps, or a stale `expires_at`.

## Units and Frames

- Linear distance: meters.
- Linear velocity: meters per second.
- Angular position and velocity: radians and radians per second.
- Temperature: degrees Celsius.
- Battery voltage: volts.
- Percent values: `0.0` to `100.0`.
- Coordinate frames follow ROS REP-103 conventions where practical:
  - `map`: globally stable world frame.
  - `odom`: locally continuous odometry frame.
  - `base_link`: robot base frame.
  - `camera_*`: camera optical frames.
- Quaternions use `[x, y, z, w]`.

## Session Lifecycle

### `session.hello`

Sent by PuppyOps to request a teleop lease.

```json
{
  "proto": "puppyops.teleop.v1",
  "type": "session.hello",
  "msg_id": "01J2Y9R1B6NND6JHB1F65KA2PS",
  "robot_id": "PuppyBot-X1",
  "seq": 1,
  "sent_at": "2026-06-26T09:12:30.000Z",
  "body": {
    "operator_id": "op_123",
    "operator_name": "PuppyOps Console",
    "client_version": "0.1.0",
    "requested_mode": "manual",
    "capabilities": ["velocity", "arm", "gripper", "media.webrtc"]
  }
}
```

### `session.accept`

Sent by the robot when it grants the lease.

```json
{
  "proto": "puppyops.teleop.v1",
  "type": "session.accept",
  "msg_id": "01J2Y9R2C4WBVQCG1RJM9568X4",
  "session_id": "tel_01J2Y9QC9E2Y4SEZQKK71WS34W",
  "robot_id": "PuppyBot-X1",
  "seq": 1,
  "sent_at": "2026-06-26T09:12:30.050Z",
  "body": {
    "lease_expires_at": "2026-06-26T09:42:30.050Z",
    "command_timeout_ms": 250,
    "heartbeat_timeout_ms": 1500,
    "max_rates": {
      "cmd.velocity_hz": 50,
      "cmd.joint_target_hz": 50,
      "telemetry.robot_state_hz": 20,
      "telemetry.joint_state_hz": 100
    },
    "capabilities": ["velocity", "arm", "gripper", "media.webrtc"]
  }
}
```

### `session.reject`

Sent by the robot when it refuses the lease.

```json
{
  "proto": "puppyops.teleop.v1",
  "type": "session.reject",
  "msg_id": "01J2Y9R2NQ6V6CC39MJ0T4Z6M7",
  "robot_id": "PuppyBot-X1",
  "seq": 1,
  "sent_at": "2026-06-26T09:12:30.050Z",
  "body": {
    "code": "lease_busy",
    "message": "Robot is controlled by another operator.",
    "retry_after_ms": 10000
  }
}
```

### `session.close`

Either side may close the session. The robot must transition to hold after
receiving this message from PuppyOps.

```json
{
  "proto": "puppyops.teleop.v1",
  "type": "session.close",
  "msg_id": "01J2Y9R9RF6GE3PRMZ95D4A74C",
  "session_id": "tel_01J2Y9QC9E2Y4SEZQKK71WS34W",
  "robot_id": "PuppyBot-X1",
  "seq": 1402,
  "sent_at": "2026-06-26T09:32:00.000Z",
  "body": {
    "reason": "operator_exit"
  }
}
```

## Heartbeats

Both sides send `heartbeat` at 2 Hz while connected.

```json
{
  "proto": "puppyops.teleop.v1",
  "type": "heartbeat",
  "msg_id": "01J2Y9R62ER4ZCB0W7W8S9AKSD",
  "session_id": "tel_01J2Y9QC9E2Y4SEZQKK71WS34W",
  "robot_id": "PuppyBot-X1",
  "seq": 61,
  "sent_at": "2026-06-26T09:12:33.000Z",
  "body": {
    "role": "puppyops",
    "last_rx_seq": 80,
    "monotonic_ms": 22839125
  }
}
```

Robot behavior:

- If no valid heartbeat or command arrives for `heartbeat_timeout_ms`, enter
  hold.
- If no valid heartbeat or command arrives for 3000 ms, enter safe stop.
- A stale command must never extend the heartbeat window.

## Command Acknowledgements

The robot must acknowledge discrete commands. Continuous commands may be
acknowledged by sequence in telemetry instead of with one ack per message.

```json
{
  "proto": "puppyops.teleop.v1",
  "type": "ack",
  "msg_id": "01J2Y9RACTDJ0WPY3Q257YTRPE",
  "session_id": "tel_01J2Y9QC9E2Y4SEZQKK71WS34W",
  "robot_id": "PuppyBot-X1",
  "seq": 82,
  "sent_at": "2026-06-26T09:12:33.140Z",
  "body": {
    "ack_type": "accepted",
    "ref_msg_id": "01J2Y9R5PZ2A0TRZ1MT0BM6N4R",
    "ref_seq": 42,
    "message": "Velocity command accepted."
  }
}
```

`ack_type` values:

- `accepted`
- `rejected`
- `expired`
- `rate_limited`
- `unsupported`

## Motion Commands

### `cmd.velocity`

Primary base teleop command. PuppyOps should send this at 20 to 50 Hz while the
operator is actively driving. Each command must include `expires_at`, normally
150 to 300 ms after `sent_at`.

```json
{
  "proto": "puppyops.teleop.v1",
  "type": "cmd.velocity",
  "msg_id": "01J2Y9R5PZ2A0TRZ1MT0BM6N4R",
  "session_id": "tel_01J2Y9QC9E2Y4SEZQKK71WS34W",
  "robot_id": "PuppyBot-X1",
  "seq": 42,
  "sent_at": "2026-06-26T09:12:33.125Z",
  "expires_at": "2026-06-26T09:12:33.325Z",
  "body": {
    "frame": "base_link",
    "linear": { "x": 0.45, "y": 0.0, "z": 0.0 },
    "angular": { "x": 0.0, "y": 0.0, "z": -0.35 },
    "speed_scale": 0.65,
    "deadman": true
  }
}
```

Robot behavior:

- Ignore velocity commands without `deadman: true`.
- Clamp velocities to the robot's active safety limits.
- If a newer valid velocity command was already applied, ignore older sequence
  numbers.
- On command expiry, transition to zero velocity hold.

### `cmd.joint_target`

Joint-space target for arms, head, torso, or other named joints.

```json
{
  "proto": "puppyops.teleop.v1",
  "type": "cmd.joint_target",
  "msg_id": "01J2Y9REPBJF8RXZ91NKRYT6JJ",
  "session_id": "tel_01J2Y9QC9E2Y4SEZQKK71WS34W",
  "robot_id": "PuppyBot-X1",
  "seq": 121,
  "sent_at": "2026-06-26T09:12:34.000Z",
  "expires_at": "2026-06-26T09:12:34.250Z",
  "body": {
    "group": "left_arm",
    "targets": [
      { "joint": "left_shoulder_pitch", "position": 0.35, "velocity": 0.5 },
      { "joint": "left_elbow", "position": 1.1, "velocity": 0.4 }
    ],
    "speed_scale": 0.5,
    "deadman": true
  }
}
```

### `cmd.end_effector_twist`

Cartesian velocity command for an end effector.

```json
{
  "proto": "puppyops.teleop.v1",
  "type": "cmd.end_effector_twist",
  "msg_id": "01J2Y9RFB5KG1JYJ2MM9X8BYW4",
  "session_id": "tel_01J2Y9QC9E2Y4SEZQKK71WS34W",
  "robot_id": "PuppyBot-X1",
  "seq": 122,
  "sent_at": "2026-06-26T09:12:34.050Z",
  "expires_at": "2026-06-26T09:12:34.250Z",
  "body": {
    "end_effector": "left_gripper",
    "frame": "base_link",
    "linear": { "x": 0.0, "y": 0.04, "z": 0.0 },
    "angular": { "x": 0.0, "y": 0.0, "z": 0.1 },
    "speed_scale": 0.5,
    "deadman": true
  }
}
```

### `cmd.gripper`

Discrete gripper command.

```json
{
  "proto": "puppyops.teleop.v1",
  "type": "cmd.gripper",
  "msg_id": "01J2Y9RHQQ5V6G2C88A5JFTVJ7",
  "session_id": "tel_01J2Y9QC9E2Y4SEZQKK71WS34W",
  "robot_id": "PuppyBot-X1",
  "seq": 130,
  "sent_at": "2026-06-26T09:12:35.000Z",
  "expires_at": "2026-06-26T09:12:36.000Z",
  "body": {
    "gripper": "left",
    "command": "position",
    "position": 0.75,
    "force_limit_n": 20.0
  }
}
```

`command` values:

- `open`
- `close`
- `stop`
- `position`

### `cmd.mode`

Requests a teleop mode transition.

```json
{
  "proto": "puppyops.teleop.v1",
  "type": "cmd.mode",
  "msg_id": "01J2Y9RJ0JPRX4BZ6ZEGS7S6M9",
  "session_id": "tel_01J2Y9QC9E2Y4SEZQKK71WS34W",
  "robot_id": "PuppyBot-X1",
  "seq": 140,
  "sent_at": "2026-06-26T09:12:36.000Z",
  "body": {
    "mode": "manual",
    "reason": "operator_requested"
  }
}
```

Mode values:

- `manual`
- `assistive`
- `hold`
- `safe_stop`

### `cmd.estop`

Emergency stop request. This is a latching command and must be acknowledged.
The robot must also support an independent hardware emergency stop path.

```json
{
  "proto": "puppyops.teleop.v1",
  "type": "cmd.estop",
  "msg_id": "01J2Y9RK9DEB6BJ8Z6E9P3PBNZ",
  "session_id": "tel_01J2Y9QC9E2Y4SEZQKK71WS34W",
  "robot_id": "PuppyBot-X1",
  "seq": 141,
  "sent_at": "2026-06-26T09:12:36.200Z",
  "body": {
    "reason": "operator_pressed_estop"
  }
}
```

Once received, the robot must stop motion and reject all motion commands until a
separate local or authorized recovery procedure clears the stop condition.

## Telemetry

### `telemetry.robot_state`

Sent by the robot at 10 to 20 Hz.

```json
{
  "proto": "puppyops.teleop.v1",
  "type": "telemetry.robot_state",
  "msg_id": "01J2Y9RNM70JZ92NE4JDR2X64N",
  "session_id": "tel_01J2Y9QC9E2Y4SEZQKK71WS34W",
  "robot_id": "PuppyBot-X1",
  "seq": 201,
  "sent_at": "2026-06-26T09:12:37.000Z",
  "body": {
    "mode": "manual",
    "safety_state": "nominal",
    "last_applied_command_seq": 140,
    "pose": {
      "frame": "map",
      "position": { "x": 12.4, "y": -3.2, "z": 0.0 },
      "orientation": [0.0, 0.0, 0.3827, 0.9239]
    },
    "twist": {
      "frame": "base_link",
      "linear": { "x": 0.43, "y": 0.0, "z": 0.0 },
      "angular": { "x": 0.0, "y": 0.0, "z": -0.32 }
    },
    "battery": {
      "percent": 78.2,
      "voltage": 25.2,
      "charging": false
    },
    "network": {
      "rssi_dbm": -62,
      "latency_ms": 38,
      "packet_loss_percent": 0.4
    }
  }
}
```

### `telemetry.joint_state`

Sent by the robot at 50 to 100 Hz when joint teleop is active.

```json
{
  "proto": "puppyops.teleop.v1",
  "type": "telemetry.joint_state",
  "msg_id": "01J2Y9RPWX80KWWA0C7YKPXS33",
  "session_id": "tel_01J2Y9QC9E2Y4SEZQKK71WS34W",
  "robot_id": "PuppyBot-X1",
  "seq": 322,
  "sent_at": "2026-06-26T09:12:37.020Z",
  "body": {
    "joints": [
      {
        "name": "left_shoulder_pitch",
        "position": 0.34,
        "velocity": 0.02,
        "effort": 1.2,
        "temperature_c": 42.0
      }
    ]
  }
}
```

### `telemetry.safety`

Sent immediately when safety state changes and then at 2 Hz while non-nominal.

```json
{
  "proto": "puppyops.teleop.v1",
  "type": "telemetry.safety",
  "msg_id": "01J2Y9RQKZ10E6GTH2D58VDNQN",
  "session_id": "tel_01J2Y9QC9E2Y4SEZQKK71WS34W",
  "robot_id": "PuppyBot-X1",
  "seq": 323,
  "sent_at": "2026-06-26T09:12:37.040Z",
  "body": {
    "safety_state": "hold",
    "causes": ["command_timeout"],
    "recoverable": true,
    "message": "No valid velocity command received within timeout."
  }
}
```

Safety states:

- `nominal`
- `hold`
- `safe_stop`
- `estop`
- `fault`

### `event.log`

Human-readable operational event.

```json
{
  "proto": "puppyops.teleop.v1",
  "type": "event.log",
  "msg_id": "01J2Y9RRQKQ88FR9V6R80M8X6K",
  "session_id": "tel_01J2Y9QC9E2Y4SEZQKK71WS34W",
  "robot_id": "PuppyBot-X1",
  "seq": 324,
  "sent_at": "2026-06-26T09:12:37.060Z",
  "body": {
    "level": "warn",
    "component": "base_controller",
    "message": "Velocity command clamped by obstacle speed limit.",
    "data": {
      "requested_x": 0.8,
      "applied_x": 0.35
    }
  }
}
```

Log levels:

- `debug`
- `info`
- `warn`
- `error`

## Media Signaling

PuppyOps and the robot use WebRTC for media. Signaling messages travel over the
control WebSocket.

### `media.streams`

Robot announces available streams.

```json
{
  "proto": "puppyops.teleop.v1",
  "type": "media.streams",
  "msg_id": "01J2Y9RT3MJ3NYWKS1T4XMWWR7",
  "session_id": "tel_01J2Y9QC9E2Y4SEZQKK71WS34W",
  "robot_id": "PuppyBot-X1",
  "seq": 330,
  "sent_at": "2026-06-26T09:12:37.100Z",
  "body": {
    "streams": [
      {
        "id": "front_rgb",
        "kind": "video",
        "frame": "camera_front",
        "recommended": true,
        "width": 1280,
        "height": 720,
        "max_fps": 30
      },
      {
        "id": "front_depth",
        "kind": "depth",
        "frame": "camera_front_depth",
        "recommended": false,
        "width": 640,
        "height": 480,
        "max_fps": 30
      }
    ]
  }
}
```

### `media.offer`, `media.answer`, `media.ice_candidate`

These messages carry WebRTC SDP and ICE data.

```json
{
  "proto": "puppyops.teleop.v1",
  "type": "media.offer",
  "msg_id": "01J2Y9RVR1EJBP32T5QY1W23ZR",
  "session_id": "tel_01J2Y9QC9E2Y4SEZQKK71WS34W",
  "robot_id": "PuppyBot-X1",
  "seq": 331,
  "sent_at": "2026-06-26T09:12:37.120Z",
  "body": {
    "sdp": "v=0...",
    "requested_streams": ["front_rgb", "front_depth"]
  }
}
```

## Error Message

Protocol-level errors use `error`.

```json
{
  "proto": "puppyops.teleop.v1",
  "type": "error",
  "msg_id": "01J2Y9RX5FQFMBZ69HM11CH5Z6",
  "session_id": "tel_01J2Y9QC9E2Y4SEZQKK71WS34W",
  "robot_id": "PuppyBot-X1",
  "seq": 340,
  "sent_at": "2026-06-26T09:12:37.200Z",
  "body": {
    "code": "invalid_message",
    "ref_msg_id": "01J2Y9R5PZ2A0TRZ1MT0BM6N4R",
    "message": "cmd.velocity requires expires_at."
  }
}
```

Error codes:

- `invalid_message`
- `unsupported_proto`
- `unsupported_type`
- `unauthorized`
- `lease_busy`
- `safety_rejected`
- `rate_limited`
- `internal_error`

## Timing Requirements

| Message | Direction | Rate |
| --- | --- | --- |
| `heartbeat` | both | 2 Hz |
| `cmd.velocity` | PuppyOps to robot | 20-50 Hz while active |
| `cmd.joint_target` | PuppyOps to robot | up to 50 Hz while active |
| `cmd.end_effector_twist` | PuppyOps to robot | up to 50 Hz while active |
| `telemetry.robot_state` | robot to PuppyOps | 10-20 Hz |
| `telemetry.joint_state` | robot to PuppyOps | 50-100 Hz while active |
| `telemetry.safety` | robot to PuppyOps | on change, then 2 Hz if non-nominal |
| `event.log` | robot to PuppyOps | event-driven |

Latency targets:

- Control message one-way latency target: under 75 ms.
- Control message one-way latency warning: over 150 ms.
- Command expiry default: 250 ms.
- Heartbeat hold timeout default: 1500 ms.
- Safe stop timeout default: 3000 ms.

## Safety Rules

- The robot must own final safety enforcement.
- PuppyOps may request motion, but the robot must clamp or reject unsafe
  commands.
- Motion commands require an active teleop lease.
- Motion commands require `deadman: true` where specified.
- Continuous motion commands require `expires_at`.
- Stale, duplicate, or out-of-order continuous commands must not be applied.
- Loss of connection must transition the robot to hold, then safe stop.
- `cmd.estop` is latching and must not be cleared by reconnecting.
- Hardware emergency stop must remain independent from this protocol.

## Versioning

The protocol version is carried in `proto`.

Compatible changes:

- Adding optional fields.
- Adding new message types that older peers may reject as unsupported.
- Adding new enum values if receivers treat unknown values as unsupported.

Breaking changes require a new `proto` value such as
`puppyops.teleop.v2`.

## Open Questions

- Exact robot id format and source of truth.
- Whether robot-agent auth is handled by mTLS, bearer tokens, or both.
- Whether WebRTC is required for all robots or optional behind a simpler MJPEG
  development profile.
- Exact joint names for PuppyBot hardware.
- Whether assistive autonomy commands belong in this teleop protocol or a
  separate mission protocol.
