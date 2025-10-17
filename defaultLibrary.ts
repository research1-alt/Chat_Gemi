
import { StoredFile } from './utils/db';

const matelEvContent = `
# EV Troubleshooting Guide

This document is a comprehensive guide based on the official MATEL electric vehicle wiring diagrams and technical notes.

## 1. Main Wiring Harness and Color Codes

### Main Components Overview:
- VCU (Vehicle Control Unit)
- MCU (Motor Control Unit)
- 12V Aux Battery & 48V Main Battery System
- Throttle & Brake Potentiometer
- DC-DC Convertor
- Telematics, Cluster, Relays, and Fuses, ignition Switch,Emergency Switch
-

### Wire Color Coding Legend:
- Aux Battery 12V: Yellow/green (+ve), Black(-ve)
- **DC 12V:** Converted 12V power
- **48V:** Main 48V power line
- **Ground:** System ground (Black)
- **CAN High:** Yellow
- **CAN Low:** Green
- **Signals:**
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

### Regen Relay (12V, 5-Pin)
- **Purpose:** During Regen Activation Brake Light should be glow.
- **Operation: Activate When Regen Activated During Vehicle Running.
- **Connections:
   **Pin 30:** 12Volt, Output to Brake Light 
   **Pin No:** 12Volt Input From Ignition Switch
   **Pin 86:** 12Volt Input From Ignition Switch
   **Pin 85:** Ground Signal From VCU From Pin no 4
 
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

const howToTestRelayContent = `
# How to Test a 5-Pin Automotive Relay

This guide provides a step-by-step procedure for testing a standard 12V, 5-pin automotive relay using a multimeter and a 12V power source.

**Tools Needed:**
- Digital Multimeter (DMM)
- 12V Power Source (e.g., a car battery or a bench power supply)
- Jumper Wires with alligator clips

**Understanding the Pins:**
A standard 5-pin relay has the following terminals:
- **Pin 30:** Common contact. This is the pin that connects to either 87 or 87a.
- **Pin 87:** Normally Open (NO) contact. Power flows to this pin from pin 30 when the relay is energized.
- **Pin 87a:** Normally Closed (NC) contact. Power flows to this pin from pin 30 when the relay is *not* energized. This is the default path.
- **Pin 86:** Control circuit positive. Connects to the 12V switch.
- **Pin 85:** Control circuit ground.

---

## Testing Procedure

### Step 1: Test the Internal Resistor (Control Circuit)

1.  Set your multimeter to the Ohms (Ω) setting, typically 200 or 2k.
2.  Connect the multimeter probes to Pin 85 and Pin 86.
3.  You should see a resistance reading, typically between 50 and 120 Ohms.
    - **Result:** If you get a reading in this range, the coil inside the relay is likely good.
    - **No Reading (OL / Open Loop):** The coil is broken. The relay is bad and must be replaced.
    - **Zero Reading (or very close):** The coil is shorted. The relay is bad and must be replaced.

### Step 2: Test the Normally Closed (NC) Circuit

1.  Keep the multimeter in Ohms (Ω) or switch to Continuity mode (the one that beeps).
2.  Connect the multimeter probes to Pin 30 and Pin 87a.
3.  The multimeter should show continuity (a reading of 0 Ohms or very close to it, and a beep if in continuity mode).
    - **Result:** This confirms the normally closed switch is working correctly.
    - **No Continuity (OL):** The internal switch is broken. The relay is bad and must be replaced.

### Step 3: Test the Switching Function (Applying Power)

**SAFETY FIRST:** Be careful when working with a power source. Ensure your connections are secure and do not short the terminals.

1.  Connect your 12V power source:
    - Connect the **positive (+)** lead to Pin 86.
    - Connect the **negative (-)** lead to Pin 85.
2.  When you make the connection, you should hear a distinct "click" sound. This is the sound of the internal switch moving from pin 87a to pin 87.
    - **No Click:** The relay is not energizing. The internal mechanism is stuck or the coil is faulty (even if it passed the resistance test). The relay is bad.
3.  **While the relay is energized (power is applied):**
    - Connect the multimeter probes (still in continuity mode) to Pin 30 and Pin 87.
    - You should now have continuity (0 Ohms / beep).
    - **Result:** This confirms the normally open switch is working correctly.
    - **No Continuity (OL):** The switch contacts are bad. The relay is faulty.
4.  **While the relay is still energized:**
    - Re-check the connection between Pin 30 and Pin 87a.
    - There should now be **NO** continuity (OL / Open Loop).
    - **Result:** This confirms the switch has successfully disconnected from the normally closed contact.
    - **Continuity remains:** The switch is stuck or welded. The relay is bad.

---

**Summary of a GOOD Relay:**
- Passes the coil resistance test (50-120Ω).
- Has continuity between 30 and 87a when *off*.
- Clicks when power is applied to 85 and 86.
- Has continuity between 30 and 87 when *on*.
- Has NO continuity between 30 and 87a when *on*.

If the relay fails any of these tests, it should be replaced.
`;

const IssueorDiagnosticDocumentContent = `
# MATEL Issueor Diagnostic and Troubleshooting Guide

This document contains a list of Issueor codes, their descriptions, causes, and recommended troubleshooting actions.

## Part 1: Comprehensive Issueor List

| S.N | Issue Code | Description |
|---|---|---|
| 1 | Issue-01 | Battery Fault |
| 2 | Issue-02 | Battery Over Temperature |
| 3 | Issue-03 | Battery Severe Over Temperature |
| 4 | Issue-04 | Battery Under Temperature |
| 5 | Issue-05 | Battery Severe Under Temperature |
| 6 | Issue-06 | Battery Severe Over Voltage |
| 7 | Issue-07 | Battery Over Voltage |
| 8 | Issue-08 | Battery Under Voltage |
| 9 | Issue-09 | Battery Severe Under Voltage |
| 10 | Issue-10 | MOSFET Failure |
| 11 | Issue-11 | Precharge Failure |
| 12 | Issue-12 | Severe DockPos Temperature |
| 13 | Issue-13 | Severe DockNeg Temperature |
| 14 | Issue-14 | Over DockPos Temperature |
| 15 | Issue-15 | Over DockNeg Temperature |
| 16 | Issue-16 | Less Battery During KeyOn |
| 17 | Issue-17 | Less Battery During Drive |
| 18 | Issue-18 | Permanent DockPos Temp |
| 19 | Issue-19 | Permanent DockNeg Temp |
| 20 | Issue-20 | MCU Communication |
| 21 | Issue-21 | EV InSense Malfunction |
| 22 | Issue-22 | EVout Sense Malfunction |
| 23 | Issue-27 | Battery Thermal Runaway Alert |
| 24 | Issue-28 | Battery Thermal Runaway |
| 25 | Issue-29 | Peak Current Warning |
| 26 | Issue-31 | Controller Overcurrent |
| 27 | Issue-32 | Current Sensor Fault |
| 28 | Issue-33 | Precharge Failed |
| 29 | Issue-34 | Controller Severe Undertemp |
| 30 | Issue-35 | Controller Severe Overtemp |
| 31 | Issue-36 | Severe B+ Undervoltage |
| 32 | Issue-37 | Severe KSI Undervoltage |
| 33 | Issue-38 | Severe B+ Overvoltage |
| 34 | Issue-39 | Severe KSI Overvoltage |
| 35 | Issue-40 | Controller Overtemp Cutback |
| 36 | Issue-41 | B+ Undervoltage Cutback |
| 37 | Issue-42 | B+ Overvoltage Cutback |
| 38 | Issue-43 | 5V Supply Failure |
| 39 | Issue-44 | Motor Temp Hot Cutback |
| 40 | Issue-45 | Motor Temp Sensor Fault |
| 41 | Issue-46 | Main Contactor Open/Short |
| 42 | Issue-47 | Sin/Cos Sensor Fault |
| 43 | Issue-48 | Motor Phase Open |
| 44 | Issue-49 | Main Contactor Welded |
| 45 | Issue-50 | Main Contactor Did not Close |
| 46 | Issue-51 | Throttle wiper High |
| 47 | Issue-52 | Throttle wiper Low |
| 48 | Issue-53 | EEPROM Failure |
| 49 | Issue-54 | VCL Run Time Issueor |
| 50 | Issue-55 | Motor Characterization fault |
| 51 | Issue-56 | Encoder Pulse Count Fault |
| 52 | Issue-57 | Encoder LOS |
| 53 | Issue-58 | Brake POT Engage |
| 54 | Issue-59 | Brake POT fault |
| 55 | Issue-60 | High Pedal Disable |

## Part 2: Detailed Issueor Diagnostics

This section provides definitions, causes, and troubleshooting for the Issueor codes.

### Issue-01: Battery Fault
- **Definition:** Battery common fault.
- **Occurrence Condition:** High Discharging current rate; Battery Internal loose connection; MCU Pushing High Regen Current; Battery Temperature sensor not working.
- **Troubleshooting:** Check Discharging current rate; Replace the Battery Pack; Check and update to MCU Team; Update to supplier.

### Issue-02: Battery Over Temperature
- **Definition:** Battery temperature is above normal safe range.
- **Occurrence Condition:** High Discharging current rate; Battery Internal loose connection; MCU Pushing High Regen Current; Battery Temperature sensor not working.
- **Troubleshooting:** Check Discharging current rate; Replace the Battery Pack; Check and update to MCU Team; Update to supplier.

### Issue-03: Battery Severe Over Temperature
- **Definition:** Battery temperature has crossed the critical safe limit, risk of damage or fire.
- **Occurrence Condition:** High Discharging current rate; Battery Internal loose connection; MCU Pushing High Regen Current; Battery Temperature sensor not working.
- **Troubleshooting:** Check Discharging current rate; Replace the Battery Pack; Check and update to MCU Team; Update to supplier.

### Issue-04: Battery Under Temperature
- **Definition:** Battery is below the safe operating range.
- **Occurrence Condition:** Battery temp sensor not Working; Ambient temp is too low to operate Battery.
- **Troubleshooting:** Check Ambient Temp and Compare with Battery temperature. If there is more Temp Difference, Update to Supplier, may be Battery Temp Sensor not Working. If Both are same than hold some time to increase Battery temp.

### Issue-05: Battery Severe Under Temperature
- **Definition:** Battery temperature has fallen well below the critical safe limit.
- **Occurrence Condition:** Battery temp sensor not Working; Ambient temp is too low to operate Battery.
- **Troubleshooting:** Check Ambient Temp and Compare with Battery temperature. If there is more Temp Difference, Update to Supplier, may be Battery Temp Sensor not Working. If Both are same than hold some time to increase Battery temp.

### Issue-06: Battery Severe Over Voltage
- **Definition:** Battery voltage has crossed the critical maximum limit.
- **Occurrence Condition:** Higher regen Current; Unauthorized Charger using.
- **Troubleshooting:** Check Regen Current Value; Use Authorized Charger.

### Issue-07: Battery Over Voltage
- **Definition:** Battery voltage is above normal safe range.
- **Occurrence Condition:** Higher regen Current; Battery Over Charge; Charging Full Indication.
- **Troubleshooting:** Check Regen Current Value; After Charging Hold the Vehicle For Some Time. It will be normal after Some Time.

### Issue-08: Battery Under Voltage
- **Definition:** Battery voltage has dropped below safe range.
- **Occurrence Condition:** Less Battery Remaining.
- **Troubleshooting:** Charge the Battery Pack; Try to Charge the Battery Pack. If not Charging Update to supplier or Charge using slow Charger.

### Issue-09: Battery Severe Under Voltage
- **Definition:** Battery voltage is far below the critical limit.
- **Occurrence Condition:** Battery is in Idle Condition from a long time.
- **Troubleshooting:** Turn off Vehicle and Update to Battery Supplier.

### Issue-10: MOSFET Failure
- **Definition:** Power MOSFET (used in BMS/inverter) stops working due to short circuit, open circuit, or thermal damage.
- **Occurrence Condition:** Current Spike during Drive.
- **Troubleshooting:** Remove all the connection. Turn on Battery Separately. If still getting Issueor, Update to Supplier.

### Issue-11: Precharge Failure
- **Definition:** Battery Internal Failure.
- **Occurrence Condition:** Internal Mishapping in Battery.
- **Troubleshooting:** Stop the Vehicle for Some time and Check Battery Voltage is going to down or not. If temp is still same, update to supplier.

### Issue-12 to Issue-15: Dock Temperature Faults
- **Issue-12:** Severe DockPos Temperature
- **Issue-13:** Severe DockNeg Temperature
- **Issue-14:** Over DockPos Temperature
- **Issue-15:** Over DockNeg Temperature
- **Definition:** Bus Bar High Temp (+ve), Bus Bar High Temp (-ve), Bus Bar Cutoff Over Temp +ve, Bus Bar Cutoff Over Temp -ve.
- **Troubleshooting:** Turn off Vehicle and Check Battery Temp. If temp is Below 60 Degree and you still get the Issueor, Update to Supplier.

### Issue-16: Less Battery During KeyOn
- **Definition:** If SOC <20%, When Ignition ON.
- **Occurrence Condition:** Battery SOC Less than 20%.
- **Troubleshooting:** Charge the Battery Pack.

### Issue-17: Less Battery During Drive
- **Definition:** If SOC <20%, While Drive.
- **Occurrence Condition:** Less Battery Voltage.
- **Troubleshooting:** Charge the Battery Pack.

### Issue-18 & Issue-19: Permanent Dock Temperature Faults
- **Issue-18:** Permanent DockPos Temp
- **Issue-19:** Permanent DockNeg Temp
- **Definition:** Recurring temp fault.
- **Troubleshooting:** Check Continous Drive Current Value. Check Wheels are loose or not. Both Condition Matters Drive Current should be less than Battery Drive current limit also wheel should be Free.

### Issue-20: MCU Communication
- **Definition:** NO Communication with MCU - Consider Mode ID from Controller ID-1826FF81, at Starting Bit 56, Length 3, Intel.
- **Occurrence Condition:** Battery not getting MCU Can; FW Related Issue.
- **Troubleshooting:** Check MCU Can is Coming in Common Can Line. Check at Battery Can Point. If both Points have MCU Can but still Issueor comes than update to Supplier.

### Issue-21 & Issue-22: EV Sense Malfunctions
- **Issue-21:** EV InSense Malfunction (Reverse current detected)
- **Issue-22:** EVout Sense Malfunction (Output voltage/current not sensed)
- **Troubleshooting:** Check the Battery cell voltages.

### Issue-27 & Issue-28: Battery Thermal Runaway
- **Definition:** As per the Battery Condition.
- **Occurrence Condition:** Battery is at its higher temp Range; Temp Sensor Issue.
- **Troubleshooting:** Check for the Battery and Controller settings; Check the Battery cell voltages.

### Issue-29: Peak Current Warning
- **Definition:** If current continuous demand more then the limit.
- **Occurrence Condition:** MCU Using Continuous high Current; Wheel Jammed.
- **Troubleshooting:** Check the voltage between Pin 1 & 5 of Encoder Connector; check for short in Brake POT or Throttle connection.

### Issue-31: Controller Overcurrent
- **Definition:** Motor current exceeded controller rated maximum.
- **Cause:** UVW terminal Loose Connection / External Short of UVW cable / burnt / continuity; Regen current not accepted by the battery; Motor parameters may be mistuned; Wheel Jammed; Motor Shaft Jammed.
- **Troubleshooting:** Check Motor U, V, W cable connections; Check for throttle release, then the Issueor comes-it is battery Issue; Auto characterise the Motor; Check for freeness of wheels, If not rotating freely, Make it free; Check the motor shaft for its free rotation; If Motor shaft is Jammed - Replace the Motor.

### Issue-32: Current Sensor Fault
- **Definition:** Current sensor auto-zero value outside of allowed range.
- **Cause:** External Short for U, V and W Cable.
- **Troubleshooting:** if the short found - Remove Short; No Short found - Replace the controller.

### Issue-33: Precharge Failed
- **Definition:** Capacitor voltage did not rise above 5V at power up.
- **Cause:** When there is any additional Load connected in 48V Line; Internal failure in controller.
- **Troubleshooting:** Check battery connection for reverse polarity, or check internal / external short circuit across the DC link; if no issue found - Replace the controller and check.

### Issue-34 & Issue-35: Controller Temperature Faults
- **Issue-34:** Controller Severe Undertemp
- **Issue-35:** Controller Severe Overtemp
- **Definition:** Controller heatsink (or junctions, capacitors, PCB) has reached critical high temperature, and the controller has shut down.
- **Cause:** Controller heatsink may be dirty / mudded; Controller heat sink is rigidly not mounted to controller; Vehicle is overloaded.
- **Troubleshooting (Undertemp):** Allow controller to warm up to normal operating temperature.
- **Troubleshooting (Overtemp):** check for Heat Sink is covered with dirt/Mud- Clean Heat Sink; check for Heat sink is properly mounted; Remove the Additional Load and allow the controller to cool down.

### Issue-36 & Issue-37: Undervoltage Faults
- **Issue-36:** Severe B+ Undervoltage
- **Issue-37:** Severe KSI Undervoltage
- **Definition (B+):** MCU Voltage is far below the critical limit.
- **Definition (KSI):** MCU KSI Voltage is below normal safe range.
- **Cause:** Battery voltage has dropped below critical level.
- **Troubleshooting:** Charge battery or check DC link voltage is within controller operating range.

### Issue-38 & Issue-39: Overvoltage Faults
- **Issue-38:** Severe B+ Overvoltage
- **Issue-39:** Severe KSI Overvoltage
- **Definition (B+):** MCU KSI Voltage is far Upper the critical limit.
- **Definition (KSI):** MCU KSI Voltage is above normal safe range.
- **Cause (B+):** Capacitor voltage is greater than rated maximum voltage for controller for longer than 1sec.
- **Cause (KSI):** Battery voltage is greater than rated maximum voltage for controller for longer than 1sec.
- **Troubleshooting:** Charge battery or check DC link voltage is within controller operating range.

### Issue-40: Controller Overtemp Cutback
- **Definition:** Controller heatsink (or junctions, capacitors, PCB) has reached critical high temperature, and the controller has shut down.
- **Cause:** Controller heatsink may be dirty / mudded; Controller heat sink is rigidly not mounted to controller; Vehicle is overloaded.
- **Troubleshooting:** check for Heat Sink is covered with dirt/Mud- Clean Heat Sink; check for Heat sink is properly mounted; Remove the Additional Load and allow the controller to cool down.

### Issue-41 & Issue-42: Voltage Cutback
- **Issue-41:** B+ Undervoltage Cutback (During running, vehicle reached to low SOC)
- **Issue-42:** B+ Overvoltage Cutback (During running at higher SOC)
- **Definition (Under):** Battery voltage is less than the configured Under Voltage limit for longer than the protection delay.
- **Definition (Over):** Battery voltage is greater than the configured Over Voltage limit for longer than the protection delay.
- **Troubleshooting:** Charge battery or check DC link voltage is within controller operating range.

### Issue-43: 5V Supply Failure
- **Definition:** 5V Supply for Analog Signal Missing.
- **Cause:** Short in Throttle, POT or Encoder Connection.
- **Troubleshooting:** check the encoder connector wiring. Check the voltage between Pin 2 & 5 of Encoder Connector. check for additional load and allow the motor to cool down.

### Issue-44: Motor Temp Hot Cutback
- **Definition:** Motor in thermal cutback.
- **Cause:** Encoder connector wire damaged or cut; Motor temperature resistor failure; Vehicle overloaded.
- **Troubleshooting:** check for the voltage between 2 and 5 in encoder connector and shall be 12V; check for the temperature resistance between pin 2 and 5 of the encoder connector of the motor side as per PT1000.

### Issue-45: Motor Temp Sensor Fault
- **Definition:** Motor Temperature input not available.
- **Cause:** Encoder connector wire damaged or cut; Motor temperature resistor failure.
- **Troubleshooting:** check for the voltage between 2 and 5 in encoder connector and shall be 12V; check for the temperature resistance between pin 2 and 5 of the encoder connector of the motor side as per PT1000.

### Issue-46: Main Contactor Open/Short
- **Definition:** Line contactor not closed.
- **Cause:** contactor coil connection issue; Contactor rust.
- **Troubleshooting:** check for coil connections; check for rust; check the coil voltage.

### Issue-47: Sin/Cos Sensor Fault
- **Definition:** SinCos Values out of range with warning.
- **Cause:** Encoder wires damaged / Pin back out; Wheels are Jammed.
- **Troubleshooting:** Check for sincos sensor, wiring and encoder configuration; Check for wheel freeness.

### Issue-48: Motor Phase Open
- **Definition:** Motor controller unable to maintain control of motor currents.
- **Cause:** Encoder angle misalignment; UVW cable loose connections; Encoder connector Pin back out.
- **Troubleshooting:** Check for motor cable and encoder connector wiring; Motor characterisation to be done.

### Issue-49: Main Contactor Welded
- **Definition:** Line contactor appears to be closed when the coil is NOT energized.
- **Cause:** Contactor tips got physically short.
- **Troubleshooting:** Check line contactor hasn't welded / closed and the wiring is correct.

### Issue-50: Main Contactor Did not Close
- **Definition:** Line contactor open circuit - contactor did not close when the coil is energized.
- **Cause:** When the contactor tip is oxidized or burnt; Battery connection issue.
- **Troubleshooting:** Check line contactor operation and wiring; Check for Battery Power connections.

### Issue-51 & Issue-52: Throttle Wiper Faults
- **Issue-51:** Throttle wiper High (Throttle signal voltage high as per define upper limit)
- **Issue-52:** Throttle wiper Low (Throttle signal voltage low as per define low limit)
- **Cause:** Throttle Wires are disconnected / shorted.
- **Troubleshooting:** Check for wiring and configuration is correct or not. If analogue input is not used the range should be set to the minimum and maximum limits.

### Issue-53: EEPROM Failure
- **Definition:** Bad NVM Data.
- **Cause:** EEPROM or flash configuration data corrupted and data can not be recovered.
- **Troubleshooting:** If firmware has recently been updated, revert to previous version. Contact Virya for support.

### Issue-54: VCL Run Time Issueor
- **Troubleshooting:** If firmware has recently been updated, revert to previous version. Contact Virya for support.

### Issue-55: Motor Characterization fault
- **Troubleshooting:** If firmware has recently been updated, revert to previous version. Contact Virya for support.

### Issue-56: Encoder Pulse Count Fault
- **Troubleshooting:** Check encoder wiring - especially shielding and routing of encoder cables. Encoder connector terminal PIN back out.

### Issue-57: Encoder LOS
- **Definition:** Encoder supply is disconnected.
- **Cause:** Encoder input supply is disconnected or no supply from Controller due to wire cut.
- **Troubleshooting:** Check encoder wiring - especially shielding and routing of encoder cables. Encoder connector terminal PIN back out.

### Issue-58: Brake POT Engage
- **Definition:** During drive, brake pot is applied.
- **Cause:** When the Throttle is in active and the brake Pot is pressed.
- **Troubleshooting:** Brake Pedal always to be in release condition during the throttle active.

### Issue-59: Brake POT fault
- **Definition:** Brake POT input voltage outside of configured range.
- **Cause:** Brake Wires are disconnected / shorted.
- **Troubleshooting:** Check for wiring and configuration is correct or not. If analogue input is not used the range should be set to the minimum and maximum limits.

### Issue-60: High Pedal Disable
- **Definition:** Any drive switch or throttle will be in active at vehicle Power ON.
- **Cause:** When the vehicle Power ON condition; When the Main Battery will switched OFF / ON.
- **Troubleshooting:** Put the drive switch to N position. Release the Throttle before turning ON.

## Part 3: Vehicle System Information

### Vehicle Start Sequencing
- **Battery Start Sequence:** Batt 6W Connector Pin no 1 to Emergency Switch Input
- **MCU Start Sequence:** Junction Box to Pin no 2 at 16 Pin Connector
- **MCU to Component Connection:** From 16 pin Connector to various components (Throttle, Brake, CAN, etc.)

### Component Operating Voltage Range
- **Battery KSI (Exicom, Amaron):** 48V
- **Battery KSI (Exponent, Sun Mobility, Clean):** PCB Voltage / 12V
- **MCU KSI:** 48V Operated
- **Throttle:** Working on 5V Supply, Idle Signal 0.8-0.9V
- **Brake Pot:** Working on 5V Supply, Signal Fix Between to 0.6V-0.8V
- **BFNR Switch:** 12V Supply
- **CAN Line (High/Low):** 2.5V-3.5V / 1.5-2.5V
- **CAN Termination (MCU/Cluster Side):** 120 Ohm

### Relay Usage
- **CDIL Relay:** 48V Relay For Immobilize MC
- **Aux Charging relay:** 48V Relay For Aux Battery Charging
- **Key Base Relay:** 48V Relay For common Aux Battery
- **Reverse Relay:** 12V Micro Relay For Reverse Light

### Wiring Harness Architecture (As Per AIS 156)
If there is any malfunction, thermal event, voltage/temperature abnormality in the pack, the Cluster should be on so that Driver can see the Issueor.
- **Basic Setup:** Aux Battery -> Fuse Box -> Emergency Switch -> Ignition Switch

*Diagrams describe relay connections for MCU, Cluster, DC Convertor, Contactor, and Regen functions.*
`;

export const matelEvKnowledgeBase: StoredFile[] = [
  {
    name: 'EV-Troubleshooting-Guide.md',
    content: matelEvContent,
    size: matelEvContent.length,
    lastModified: Date.now(),
  },
  {
    name: 'How-To-Test-A-Relay.md',
    content: howToTestRelayContent,
    size: howToTestRelayContent.length,
    lastModified: Date.now() - 1, // ensure it's slightly different
  },
  {
    name: 'MATEL-Issueor-Diagnostic-Guide.md',
    content: IssueorDiagnosticDocumentContent,
    size: IssueorDiagnosticDocumentContent.length,
    lastModified: Date.now() - 2,
  }
];
