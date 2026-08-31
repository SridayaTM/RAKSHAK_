# RAKSHAK

### Intelligent Mine Rescue & Underground Situational Awareness System

RAKSHAK is a unified mine-rescue control-room platform designed to provide operators with a real-time operational picture of an underground rover mission.

The system brings together **live vision, thermal sensing, atmospheric monitoring, 3D LiDAR/SLAM mapping, communications, detection, and safety-state logic** into a single control interface.

The objective is simple:

> **Understand the underground environment before exposing rescuers to it.**

---

## Overview

Underground rescue operations are often performed with incomplete information about the environment, atmospheric conditions, visibility, communications, and the location of potential survivors.

RAKSHAK addresses this by using a remotely operated rover as an information-gathering platform.

Instead of presenting isolated sensor values, RAKSHAK combines multiple sources of evidence into a unified operational picture.

```text
                    UNDERGROUND ROVER
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   ATMOSPHERE           VISION             LiDAR
 CH₄ / CO / O₂        IR / Thermal        SLAM
   / CO₂                 │                  │
        │                │                  │
        └────────────────┼──────────────────┘
                         │
                         ▼
                  EVIDENCE FUSION
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
      DETECTION      COMMUNICATION     SAFETY
          │              │              │
          └──────────────┼──────────────┘
                         │
                         ▼
                OPERATIONAL DECISION
