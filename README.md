# Smart Indoor Walker

A full-size indoor walker for older adults. It maps a room with 2D LiDAR, drives to a point selected on the map, avoids obstacles, and raises or lowers the seat to help the user sit and stand.

Top Excellence Award, 2025 SDGs Social Problem-Solving Competition (Sep to Dec 2025)

Software: ROS 2, Cartographer, Python, Arduino
Hardware: RDK X5, 2D LiDAR, IMU, two DC gear motors with quadrature encoders, two linear actuators, Arduino UNO

## System

```mermaid
flowchart LR
    UI["Web console<br/>map, goal, manual control, seat height"]
    subgraph RDK["RDK X5, ROS 2"]
        BR["rosbridge"]
        LD["LiDAR driver"]
        IMU["IMU node"]
        CG["Cartographer"]
        AV["Goal navigation and<br/>obstacle avoidance"]
        DRV["serial_motor_driver.py"]
    end
    subgraph ARD["Arduino UNO"]
        FW["walker_controller.ino"]
    end
    M["Wheel motors<br/>and encoders"]
    A["Seat actuators"]

    UI <-->|WebSocket| BR
    BR -->|goal| AV
    BR -->|/chair_height_cmd| DRV
    LD -->|/scan| CG
    LD -->|/scan| AV
    IMU --> BR
    CG -->|/map, pose| BR
    CG -->|pose| AV
    AV -->|/cmd_vel| DRV
    DRV <-->|USB serial 115200| FW
    FW -->|PWM, direction| M
    M -->|encoder edges| FW
    FW -->|PWM, direction| A
```

ROS 2 handles planning and motion. The Arduino controls the motors and counts encoder edges using interrupts, so Linux scheduling does not delay pulse counting.

## Serial link

```mermaid
sequenceDiagram
    participant D as serial_motor_driver.py
    participant F as walker_controller.ino
    D->>F: c,LEFT_PWM,RIGHT_PWM
    D->>F: u, d, or s (seat up, down, stop)
    loop every 20 ms
        F->>D: e,LEFT_COUNT,RIGHT_COUNT
    end
```

| Line | Direction | Meaning |
|---|---|---|
| `c,<left>,<right>` | RDK X5 to Arduino | wheel PWM, −255 to 255 |
| `u`, `d`, `s` | RDK X5 to Arduino | seat up, down, stop |
| `e,<left>,<right>` | Arduino to RDK X5 | cumulative encoder counts |

The driver subscribes with a queue depth of 1, so it sends only the latest velocity command. The counts are cumulative, so a dropped line does not lose distance data.

## Base driver

```mermaid
flowchart LR
    V["/cmd_vel<br/>v, ω"] --> K["v_L = v − ω × b / 2<br/>v_R = v + ω × b / 2"]
    K --> P["PWM = 380 × v_L, −480 × v_R<br/>clamped to ±255"]
    P --> S["c,L,R"]
    E["e,L,R"] --> D["Δcount since previous line"]
    D --> W["distance per wheel<br/>Δcount × 2πr / 1100 × bias"]
    W --> I["Δs = (d_L + d_R)/2<br/>Δθ = (d_R − d_L)/b"]
    I --> O["/odom and odom → base_footprint"]
```

| Parameter | Value |
|---|---|
| Wheel radius r | 0.038 m |
| Track b | 0.45 m |
| Encoder counts per wheel turn | 1100 |
| Left encoder factor | 1.0508 (the two encoders differed by 5%) |
| Odometry update | 50 Hz |

## Power

```mermaid
flowchart LR
    B["4S Li-ion pack<br/>14.8 V"] --> BMS["BMS"]
    BMS -->|14.8 V| WD["Wheel motor drivers"]
    BMS --> C12["12 V converter"] -->|12 V| AD["Dual 10 A motor driver<br/>seat actuators"]
    BMS --> C5["5 V converter"] -->|5 V| CT["RDK X5, Arduino, sensors"]
```

The motors and the logic are fed through separate converters.

## What I built

- Electronics: sensor selection, the two-controller architecture, and the three supply rails
- ROS 2 autonomy: LiDAR SLAM, goal navigation, and obstacle avoidance
- The base driver node and Arduino firmware in this repository
- The web console

## Result

The full-size prototype mapped a campus corridor, drove to goals selected on the map, and avoided obstacles. Parts cost KRW 320,000.

## Repository

```
ros2/serial_motor_driver.py
firmware/walker_controller/walker_controller.ino
```

## Run

```bash
python3 ros2/serial_motor_driver.py
```

The Arduino is expected at `/dev/ttyACM0`.