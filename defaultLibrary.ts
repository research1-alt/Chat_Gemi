import { StoredFile } from './utils/db';

const troubleshootingGuideContent = `--- HydroSpanner 5000 Troubleshooting Guide ---

Error Code: E-01 - Power Fluctuation
Symptoms: Unit shuts down intermittently. Power light flashes red.
Solution:
1. Verify the power source is stable and meets the 220V requirement.
2. Check the main power cable for any visible damage. Replace if necessary (Part No. HS-PC-001).
3. Inspect the internal fuse F1 on the main board. If blown, replace with a 5A fuse (Part No. HS-FS-005).

Error Code: E-02 - Coolant Leak
Symptoms: Puddle forming under the unit. Overheating warnings.
Solution:
1. Immediately power down the unit and disconnect from power source.
2. Locate the source of the leak. Check all hose connections (H1, H2, H3).
3. Tighten any loose connections.
4. If a hose is cracked, replace it with the appropriate part number.
5. Refill coolant reservoir with approved HydroCoolant fluid (Part No. HC-FL-050).

Error Code: E-03 - Gyro-Calibrator Misalignment
Symptoms: Unit vibrates excessively during operation. Loud grinding noise.
Solution:
1. Engage the safety lock to prevent accidental startup.
2. Open the main access panel.
3. Loosen the four gyro-mount bolts.
4. Using a laser alignment tool, recalibrate the gyro to within 0.05mm tolerance.
5. Tighten the mount bolts in a star pattern to 25 Nm.
6. Run diagnostic cycle C-4 to verify alignment.
`;

const partNumbersContent = `Part Number,Description,Price
HS-PC-001,Main Power Cable 2m,25.00
HS-FS-005,Fuse 5A 250V (Pack of 10),15.50
HC-FL-050,HydroCoolant Fluid 5L,75.00
HS-HOSE-A,Coolant Hose Assembly A,45.20
HS-HOSE-B,Coolant Hose Assembly B,48.90
HS-FILTER-01,Primary Coolant Filter,32.00
`;

export const defaultLibraryFiles: StoredFile[] = [
  {
    name: 'troubleshooting-guide.txt',
    content: troubleshootingGuideContent,
    size: troubleshootingGuideContent.length,
    lastModified: Date.now(),
  },
  {
    name: 'part-numbers.csv',
    content: partNumbersContent,
    size: partNumbersContent.length,
    lastModified: Date.now(),
  },
];
