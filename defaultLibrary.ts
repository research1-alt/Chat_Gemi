import { StoredFile } from './utils/db';

const matelEvContent = `
# Matel EV Wiring and Troubleshooting Guide

This document is a comprehensive guide based on the official MATEL electric vehicle wiring diagrams and technical notes.

## 1. Main Wiring Harness and Color Codes

### Main Components Overview:
- VCU (Vehicle Control Unit)
- MCU (Motor Control Unit)
- 12V Aux Battery & 48V Main Battery System
- Throttle & Brake Potentiometer
- DC Convertor
- Telematics, Cluster, Relays, and Fuses

### Wire Color Coding Legend:
- **Aux Battery 12V:** Standard 12V positive line
- **DC 12V:** Converted 12V power
- **48V:** Main 48V power line
- **Ground:** System ground
- **CAN High:** Yellow
- **CAN Low:** Green
- **Signals:** Orange
- **Cluster Delay:** Dedicated signal for cluster timing
- **5V Supply:** Low voltage supply for sensors

---

## 2. Relay Specifications and Functions

### Cluster Relay (12V, 5-Pin)
- **Purpose:** Controls power to the instrument cluster.
- **Ignition On:** Energized by Ignition Switch (Pin 3). Connects pin 87 to 30, powering the cluster.
- **Charging:** Receives power on pin 87a from the DC Convertor, which is then routed to pin 30 to power the cluster.
- **Connections:**
  - **Pin 30:** Output to Cluster Meter (White/Red)
  - **Pin 87a:** Input from DC Convertor during charging (Yellow)
  - **Pin 86:** Input from Ignition Switch (Pink/Yellow)
  - **Pin 85:** Common Ground

### Reverse Relay (12V, 4-Pin)
- **Purpose:** Activates the reverse tail lamp.
- **Operation:** Ground signal from the BFNR (Mode) switch energizes the coil.
- **Connections:**
  - **Pin 30:** Input from DC Output Relay (Yellow/Black)
  - **Pin 87:** Output to Reverse Lamp (White)
  - **Pin 86:** 12V from Ignition Switch (Yellow/Red)
  - **Pin 85:** Ground from BFNR Switch (Red/Green)

### 48V Battery Ignition Relay (R48VBatt) (12V, 4-Pin)
- **Purpose:** Engages the main 48V battery.
- **Operation:** When energized by the ignition switch, shorts the battery ignition wire to turn the main battery ON.
- **Connections:**
  - **Pin 30 & 87:** Connected to Batt 6W terminals.
  - **Pin 86:** 12V from Ignition Switch Pin 3.
  - **Pin 85:** Ground from Cluster Delay Pin 1.

### MCU Relay (Virya Gen 2) (48V, 5-Pin)
- **Purpose:** Controls the 48V wake-up power to the MCU.
- **Operation:** Power is normally passed through (87a to 30). When ground is applied to Pin 85 (during charging or immobilization command), the relay activates and cuts power to the MCU.
- **Connections:**
  - **Pin 30:** 48V output to MCU wake-up (Orange)
  - **Pin 87a & 86:** Looped; 48V input from FDCI fuse (Gray)
  - **Pin 85:** Ground from Charging Cutoff or Telematics (Immobilizer)

### DC Output Relay (RDC_Output) (12V, 5-Pin)
- **Purpose:** Distributes 12V power from the DC-DC converter to components and the Aux battery.
- **Connections:**
  - **Pin 30:** Input from DC Convertor (via F12V fuse)
  - **Pin 87:** Output to 12V components & Aux Battery charging
  - **Pin 87a:** Output to Cluster Relay for charging time
  - **Pin 86:** 12V from Ignition Switch

### Aux Battery Charging Relay (48V, 5-Pin)
- **Purpose:** Manages charging of the 12V Aux battery from the 48V system.
- **Operation:** Activates only when the vehicle is connected to a charger.
- **Connections:**
  - **Pin 30:** Output to DC Convertor input
  - **Pin 87:** Output to Aux Battery (via 7.5A fuse)
  - **Pin 86:** 48V input from terminal box
  - **Pin 85:** Ground from Charging Cutoff Pin 2

---

## 3. Fuses, Switches, and Diodes

### Fuse Box Layout
- **F12V:** 15A - DC Convertor Output (12V)
- **FAB:** 7.5A - Aux Battery Protection
- **FDCI:** 7.5A - DC Convertor Input
- **FMCU:** 1A - MCU Ignition Line
- **FFP:** 1A - 12V Aux Connector

### Vehicle Ignition Circuit
- The 12V Aux Battery is the primary source for ignition. If it is dead, the vehicle will not start.
- **Power Path:** Aux Battery -> FAB fuse -> Emergency Switch -> Ignition Switch.
- **Ignition Switch:** Has 2 steps. Step 1 turns on the Battery. Step 2 turns on the MCU.

### Mode Switch (BFNR)
- Provides mode selection signals (Forward, Reverse, Boost, etc.) to the VCU by sending a 12V signal to the corresponding VCU pin.

### Diode Usage
- **CID:** Ensures single-direction current flow for the DC Convertor input.
- **CC:** Used in the charging cutoff line.
- **AUX BAT:** Used for charging the Aux Battery from the DC Convertor.

---

## 4. VCU & MCU Pinouts

### MCU Pins (Selected)
- **1, 10:** 12V Ignition Input
- **11, 12:** CAN High/Low
- **19:** 5V Supply to Encoder
- **20:** Motor Temperature Sensor Input

### VCU Pins (Selected)
- **1, 6:** Mode Inputs (Reverse, Neutral)
- **2, 11:** Throttle Signal Inputs
- **4:** Ground output to Regen Relay
- **8, 12:** Mode Inputs (Boost, Gradient)
- **14:** Brake Pot Signal Input

---

## 5. Operational Procedures & Notes

### Vehicle Start Sequence
1. **Key Turn (Step 1):** Main 48V Battery turns ON. MCU remains OFF.
2. **Key Turn (Step 2):** MCU turns ON.
- **Important:** This sequence is critical for saving the odometer reading correctly. If the MCU and Battery turn on simultaneously, the reading may not be saved. This can indicate a faulty MCU relay.

### CAN Bus Notes
- 120 Ohm termination resistors are located in the Cluster and MCU.
- The battery and charger do not have termination.
- With all components connected, the total bus resistance should measure ~60 Ohms.
`;

export const matelEvKnowledgeBase: StoredFile[] = [
  {
    name: 'MATEL-EV-Troubleshooting-Guide.md',
    content: matelEvContent,
    size: matelEvContent.length,
    lastModified: Date.now(),
  },
];
