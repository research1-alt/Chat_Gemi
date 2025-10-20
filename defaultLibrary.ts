
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

const IssueorDiagnosticDocumentContent = `
# Error - Diagnostic Document

This document provides a comprehensive list of error codes, their descriptions, definitions, occurrence conditions, and troubleshooting steps.

---

## Err-01: Battery Fault
- **Definition:** Battery common fault.
- **Occurrence Condition:** 
  1. It comes along with a another Error
- **Troubleshooting:**
  1.Check another error
  2. If there is not any another error. Update to supplier.

## Err-02: Battery Over Temperature
- **Definition:** Battery temperature is above normal safe range.
- **Occurrence Condition:**
  1. Due to high Discharging current rate.
  2. Due to Battery Internal loose connection.
  3. MCU Pushing High Regen Current.
  4. Battery Temperature sensor not working.
- **Troubleshooting:**
  1. Check Dishcarging current rate.If Found as per required that's ok.
  2. Replace the Battery Pack.
  3. Check and update to MCU Team.
  4. Update to supplier.

## Err-03: Battery Severe Over Temperature
- **Definition:** Battery temperature has crossed the critical safe limit, risk of damage or fire.
- **Occurrence Condition:** 
 "1. Due to high Discharging current rate. 
  2. Due to Battery Internal loose connection.
  3. MCU Pushing High Regen Current.
  4. Battery Temperature sensor not working."

- **Troubleshooting:** 
  Check Ambient Temp and Compare with Battrey temperature.
  "1. Check Dishcarging current rate.If Found as per required that's ok.
   2. Replace the Battery Pack.
   3. Check and update to MCU Team.
   4. Update to supplier."

## Err-04: Battery Under Temperature
- **Definition:** Battery is below the safe operating range.
- **Occurrence Condition:** 
  1. Battery temp sensor not Working.
  2. Ambient temp is too low to operate Battery.
- **Troubleshooting:** 
  Check Ambient Temp and Compare with Battrey temperature.
  1. If there is more Temp Differnece. Update to Supplier, may be Battery Temp Sensor not Working.
  2. If Both are same than hold some time to increase Battery temp.

## Err-05: Battery Severe Under Temperature
- **Definition:** Battery temperature has fallen well below the critical safe limit.
- **Occurrence Condition:** 
  1. Higher regen Current.
  2. Unauthorized Charger using.
- **Troubleshooting:** 
  Check Ambient Temp and Compare with Battrey temperature.
  1. Check Regen Current Value.
  2. Use Authorized Charger.

## Err-06: Battery Severe Over Voltage
- **Definition:** Battery voltage has crossed the critical maximum limit.
- **Occurrence Condition:**
  1. Higher regen Current.
  2. Battery Over Charge.
  3. Charging Full Indication.
- **Troubleshooting:**
  1. Check Regen Current Value.
  2. After Charging Hold the Vehicle For Some Time.It will be normal after Some Time.

## Err-07: Battery Over Voltage
- **Definition:** Battery voltage is above normal safe range.
- **Occurrence Condition:** 
  1.Higher regen Current.
  2. Battery Over Charge.
  3. Charging Full Indication."
 Less Battery Remaining.
- **Troubleshooting:** 
  1. Check Regen Current Value.
  2. After Charging Hold the Vehicle For Some Time.It will be normal after Some Time."


## Err-08: Battery Under Voltage
- **Definition:** Battery voltage has dropped below safe range.
- **Occurrence Condition:** 
  1. Battery is in Idle Condition from a long time.
  2. Less Battery Remaining.
- **Troubleshooting:** 
  1. Charge the Battery Pack.
.

## Err-09: Battery Severe Under Voltage
- **Definition:** Battery voltage is far below the critical limit.
- **Occurrence Condition:** 
  1. Battery is in Idle Condition from a long time.
- **Troubleshooting:** 
  1.Try to Charge the Battery Pack. 
  If not Charging Update to supplier or Charge using slow Charger."


## Err-10: MOSFET Failure
- **Definition:** Power MOSFET (used in BMS/inverter) stops working due to short circuit, open circuit, or thermal damage.
- **Occurrence Condition:** 
  1. Current Spike during Drive.
- **Troubleshooting:** NA
  1. Turn off Vehicle and Update to Battery Supplier.

## Err-11: Precharge Failure
- **Definition:** Battrey Internal Failure
- **Occurrence Condition:** 
  1. Internal Mishapping in Battery.
- **Troubleshooting:** 
  1. Remove all the connection. 
  2. Turn on Battery Separtely. If still getting Error, Update to Supplier."


## Err-12: Severe DockPos Temperature
- **Definition:** Bus Bar High Temp (+ve)
- **Occurrence Condition:** NA
- **Troubleshooting:** NA

## Err-13: Severe DockNeg Temperature
- **Definition:** Bus Bar High Temp (-ve)
- **Occurrence Condition:** NA
- **Troubleshooting:** NA

## Err-14: Over DockPos Temperature
- **Definition:** Bus Bar Cuttoff Over Temp +ve
- **Occurrence Condition:** NA  
- **Troubleshooting:** NA
  
## Err-15: Over DockNeg Temperature
- **Definition:** Bus Bar Cuttoff Over Temp -ve
- **Occurrence Condition:** NA
- **Troubleshooting:** NA

## Err-16: Less Battery During KeyOn
- **Definition:** If SOC <20%, When Ignition ON
- **Occurrence Condition:** 
  1. Battery SOC Less than 20% 
- **Troubleshooting:** 
  1. Charge the Battery Pack. If Battery is not Charging use another charger.May be Can Communication not stablished between Battery and Charger.

## Err-17: Less Battery During Drive
- **Definition:** If SOC <20%, While Drive
- **Occurrence Condition:** 
  1. Less Battery Voltage. 
- **Troubleshooting:** 
  1. Charge the Battery Pack.

## Err-18: Permanent DockPos Temp
- **Definition:** Recurring temp fault
- **Occurrence Condition:** NA
- **Troubleshooting:** NA

## Err-19: Permanent DockNeg Temp
- **Definition:** Recurring temp fault
- **Occurrence Condition:** NA
- **Troubleshooting:** NA

## Err-20: MCU Communication
- **Definition:** NO Communication with MCU - Consider Mode ID from Controller ID-1826FF81, at Starting Bit 56, Length 3, Intel,
- **Occurrence Condition:** 
  1. Battery not getting MCU Can.
  2. FW Related Issue."
- **Troubleshooting:**
  1. Check MCU Can is Coming in Common Can Line.
  2. Check at Battery Can Point. 
  If both Points have MCU Can but still error comes than update to Supplier."

## Err-21: EV InSense Malfunction
- **Definition:** Reverse current detected
- **Occurrence Condition:** NA
- **Troubleshooting:**NA

## Err-22: EVout Sense Malfunction
- **Definition:** Output voltage/current not sensed
- **Occurrence Condition:** Na
  - **Troubleshooting:** NA
  
## Err-27: Battery Thermal Runaway Alert
- **Definition:** As per the Battery Condition
- **Occurrence Condition:** 
  1-Battery is at his higher temp Range. 
  2- Temp Sensor Issue."
- **Troubleshooting:**
  1. Stop the Vehicle for Some time and Check Battery Voltage is going to down or not.
  2. If temp is still same, update to supplier."


## Err-28: Battery Thermal Runaway
- **Definition:** As per the Battery Condition
- **Occurrence Condition:** 
  1- Battery higher Internal Temp.
  2. Temp Sensor Not working."
- **Troubleshooting:**
  1. Turn off Vehicle and Check Battery Temp.
  If temp is Below 60 Degree and you still get the Error, Update to Supplier.
  2- Update to Supplier.

## Err-29: Peak Current Warning
- **Definition:** If current contineous demand more then the limit
- **Occurrence Condition:** 
  1. MCU Using Continous high Current.
  2. Wheel Jamed.
- **Troubleshooting:**
  1. Check Continous Drive Current Value. 
  2. Check Wheels are loose or not.
  Both Condition Matters Drive Current should be less than Battery Drive current limit also wheel should be Free."

## Err-31: Controller Overcurrent
- **Definition:** Motor current exceeded controller rated maximum
- **Occurrence Condition:** 
  1. Controller heatsink may be dirty / mudded.
  2. Regen current not accepted by the battery.
  3. Vehicle is overloaded or Wheel Jammed.
  4. UVW terminal  Loose Connection / External Short of UVW cable / burnt / continuity
  5. Motor paramaters may be mistuned.
- **Troubleshooting:** 
  1. Allow controller to warm up to normal operating temperature.
  2. Check Motor U, V W cable connections
  2. Check for throttle release, then the error comes-it is  battery Issue.
  3. Auto characterise the Motor
  4. Check for freeness of wheels ,If not rotating freely ,Make it free
  5. Check the motor shaft for its free rotation.-If Motor shaft is Jammed - Replace the Motor.
  6. If you check everything is clear but still getting the error, Immerdiatly update to supplier.
    

## Err-32: Current Sensor Fault
- **Definition:** Current sensor auto-zero value outside of allowed range
- **Occurrence Condition:** 
  1. External Short for U, V and W Cable.
- **Troubleshooting:** 
  1. if the short found- Remove Short.
  2. No Short found - Replace the controller"

## Err-33: Precharge Failed
- **Definition:** Capacitor voltage did not rise above 5V at power up
- **Occurrence Condition:** 
  1. When there is any additional Load connected in 48V Line
  2. Internal failure in controller"
- **Troubleshooting:** 
  1. Check battery connection for reverse polarity, or check internal / external short circuit across the DC link
  2. if no issue found - Replace the controller and check"

## Err-34: Controller Severe Undertemp
- **Definition:** Controller heatsink (or junctions, capacitors, PCB) has reached critical low temperature, and the controller has shut down.
- **Occurrence Condition:** 
- **Troubleshooting:** 
  1. Allow controller to warm up to normal operating temperature

## Err-35: Controller Severe Overtemp
- **Definition:** Controller heatsink (or junctions, capacitors, PCB) has reached critical high temperature, and the controller has shut down.
- **Occurrence Condition:**
  1. Controller heatsink may be dirty / mudded
  2. Controller heat sink is rigidly not mounted to controller.
  3. Vehicle is overloaded"
- **Troubleshooting:** 
  1. check for Heat Sink is covered with dirt/Mud- Clean Heat Sink.
  2. check for Heat sink is properly mounted
  3. Remove the Additional Load and allow the controller to cool down"


## Err-36: Severe B+ Undervoltage
- **Definition:** MCU Voltage is far below the critical limit.
- **Occurrence Condition:**
  1. Battery voltage has dropped below critical level
- **Troubleshooting:** 
  1. Charge battery or check DC link voltage is within controller operating range

## Err-37: Severe KSI Undervoltage
- **Definition:** MCU KSIVoltage is below normal safe range.
- **Occurrence Condition:** 
  1. Battery voltage is less than rated minimum voltage for controller for longer than 1sec
- **Troubleshooting:**
  1. Charge battery or check DC link voltage is within controller operating range


## Err-38: Severe B+ Overvoltage
- **Definition:** MCU KSI Voltage is far Upper the critical limit.
- **Occurrence Condition:** 
  1. Capacitor voltage is greater than rated maximum voltage for controller for longer than 1sec.
- **Troubleshooting:** 
  1. Charge battery or check DC link voltage is within controller operating range. 

## Err-39: Severe KSI Overvoltage
- **Definition:** MCU KSIVoltage is above normal safe range.
- **Occurrence Condition:** 
  1. Battery voltage is greater than the configured Over Voltage limit for longer than the protection delay
- **Troubleshooting:**
  1. Charge battery or check DC link voltage is within controller operating range

## Err-40: Controller Overtemp Cutback
- **Definition:** Controller heatsink (or junctions, capacitors, PCB) has reached critical high temperature, and the controller has shut down.
- **Occurrence Condition:** 
  1. Controller heatsink may be dirty / mudded
  2. Controller heat sink is rigidly not mounted to controller.
  3. Vehicle is overloaded.
- **Troubleshooting:**
  1. check for Heat Sink is covered with dirt/Mud- Clean Heat Sink.
  2. check for Heat sink is properly mounted
  3. Remove the Additional Load and allow the controller to cool down"

## Err-41: B+ Undervoltage Cutback
- **Definition:** NA
- **Occurrence Condition:**
  1. During running, vehicle reached to low SOC.
  2. During Running, Battery KSI is going to OFF.
- **Troubleshooting:**
  1. Check the Battery Pack voltages. Also check the Battery KSI Signal and Battery Voltage Signal in CAN.

## Err-42: B+ Overvoltage Cutback
- **Definition:** Battery voltage is greater than the configured Over Voltage limit for longer than the protection delay
- **Occurrence Condition:** 
  1. Normal operation. Fault shows that regen braking currents elevated the battery voltage during regen braking. Controller is performance limited at this voltage.
  2. Battery parameters are misadjusted. 
  3. Battery resistance too high for given regen current. 
  4. Battery disconnected while regen braking
- **Troubleshooting:**
  1. check for the voltage between 2 and 5 in encoder connector and shall be 12V
  2. check for the temperature resistance between pin 2 and 5 of the encoder connector of the motor side as per PT1000.
  Note:- This is declared only when the Controller is running in regen.
  3. Check all the given occurrence condition. if It's still continue update to supplier immedately.

## Err-43: 5V Supply Failure
- **Definition:** 5V Supply for Analog Signal Missing
- **Occurrence Condition:** 
  1. 1- Short in Throttle, POT or Encoder Connection.
- **Troubleshooting:**
  1. Check the voltage between Pin 1 & 5 of  Encoder Connector
  2. Check for short in Brake POT or Throttle connection"


## Err-44: Motor Temp Hot Cutback
- **Definition:** Motor in thermal cutback
- **Occurrence Condition:** 
  1. Encoder connector wire damaged or cut
  2. Motor temperature resistor failure
  3. Vehicle overloded"
- **Troubleshooting:**
  1. check the encoder connector wiring.
  2. Check the voltage between Pin 2 & 5 of  Encoder Connector
  3. check for additional load and allow the motor to cool down"

## Err-45: Motor Temp Sensor Fault
- **Definition:** Motor Temperature input not available
- **Occurrence Condition:**
  1. Encoder connector wire damaged or cut
  2. Motor temperature resistor failure"
- **Troubleshooting:**
  1. check for the voltage between 2 and 5 in encoder connector and shall be 12V
  2. check for the temperature resistance between pin 2 and 5 of the encoder connector of the motor side as per PT1000."

## Err-46: Main Contactor Open/Short
- **Definition:** Line contactor not closed
- **Occurrence Condition:** 
  1. contactor coil connection issue
  2. Contactor rust"
- **Troubleshooting:** 
  1. check for coil connections
  2. check for rust
  3. check the coil voltage"


## Err-47: Sin/Cos Sensor Fault
- **Definition:** SinCos Values out of range with warning
- **Occurrence Condition:**
  1. Encoder wires damaged / Pin back out
  2. Wheels are Jammed"
 Line contactor open circuit - contactor did not close when the coil is energized
- **Troubleshooting:**
  1. Check for sincos sensor, wiring and encoder configuration
  2. Check for wheel freeness."


## Err-48: Motor Phase Open
- **Definition:** Motor controller unable to maintain control of motor currents
- **Occurrence Condition:** 
  1. Encoder angle misalignment
  2. UVW cable loose connections
  3. Encoder connector Pin back out"
- **Troubleshooting:** 
  1. Check for motor cable and encoder connector wiring.
  2. Motor characterisation to be done."


## Err-49: Main Contactor Welded
- **Definition:** Line contactor appears to be closed when the coil is NOT energized
- **Occurrence Condition:** 
  1. 1. Contactor tips got physically short.
- **Troubleshooting:**
  1. Check line contactor hasn't welded / closed and the wiring is correct

## Err-50: Main Contactor Did not Close
- **Definition:** Line contactor open circuit - contactor did not close when the coil is energized
- **Occurrence Condition:** 
  1. When the contactor tip  is oxidized or burnt
  2. Battery connection issue"
- **Troubleshooting:** 
  1. Check line contactor operation and wiring
  2. Check for Battery Power connections"

## Err-51: Throttle wiper High
- **Definition:** Throttle signal voltage high as per define upper limit.
- **Occurrence Condition:** 
  1. Throttle Wires are disconnected / shorted.
- **Troubleshooting:**
  1. Check for wiring and configuration is correct or n ot. If analogue input is not used the range should be set to the minimum and maximum limits 
 
## Err-52: Throttle wiper Low
- **Definition:** Throttle signal voltage low as per define low limit.
- **Occurrence Condition:** 
  1. Throttle Wires are disconnected / shorted.
- **Troubleshooting:** 
  1. Check for wiring and configuration is correct or n ot. If analogue input is not used the range should be set to the minimum and maximum limits

## Err-53: EEPROM Failure
- **Definition:** Bad NVM Data.
- **Occurrence Condition:** 
  1. EEPROM or flash configuration data corrupted and data can not be recovered.
- **Troubleshooting:** 
  1. If firmware has recently been updated, revert to previous version. Contact Virya for support.

## Err-54: VCL Run Time Error
- **Definition:** VCL code encountered a runtime
- **Occurrence Condition:** 
  1. VCL code encountered a runtime
 - **Troubleshooting:** 
  1. Update to Supplier

## Err-55: Motor Characterization fault
- **Definition:** characterization failed during characterization process
- **Occurrence Condition:** 
  1. 1. Motor characterization failed during characterization process. 
- **Troubleshooting:** 
  1. Update to Supplier.

## Err-56: Encoder Pulse Count Fault
- **Definition:** NA
- **Occurrence Condition:** 
  1. Encoder Steps parameter does not match the actual motor encoder.
- **Troubleshooting:**
  1. Update to Supplier.

## Err-57: Encoder LOS
- **Definition:** Encoder supply is disconnected.
- **Occurrence Condition:** 
  1. Encoder input supply is disconnected or no supply from Controller due to wire cut
- **Troubleshooting:** 
  1. Check encoder wiring - especially shielding and routing of encoder cables.
  2. Encoder connector terminal PIN back out.

## Err-58: Brake POT Engage
- **Definition:** During drive, brake pot is applied.
- **Occurrence Condition:** 
  1. When the Throttle is in active and the brake Pot is pressed
- **Troubleshooting:** 
  1. Brake Pedal always to be in release condition during the throttle active

## Err-59: Brake POT fault
- **Definition:** Brake POT input voltage outside of configured range.
- **Occurrence Condition:** 
  1. Brake Wires are disconnected / shorted
- **Troubleshooting:** 
  1. Check for wiring and configuration is correct or not. If analogue input is not used the range should be set to the minimum and maximum limits

## Err-60: High Pedal Disable
- **Definition:** Any drive switch or throttle will be in active at vehicle Power ON.
- **Occurrence Condition:** 
  1. When the vehicle Power ON condition
  2. When the Main Battery will switched OFF / ON"
- **Troubleshooting:**
  1. Put the drive switch to N position.
  2. Release the Throttle before turning ON
`;

export const matelEvKnowledgeBase: StoredFile[] = [
  {
    name: 'EV-Troubleshooting-Guide.md',
    content: matelEvContent,
    size: matelEvContent.length,
    lastModified: Date.now(),
  },
  {
    name: 'ErrorCode-Diagnostic-Document.md',
    content: IssueorDiagnosticDocumentContent,
    size: IssueorDiagnosticDocumentContent.length,
    lastModified: Date.now() - 2,
  },
];
