/**
 * @module install
 * Installation instructions data for the download page.
 */

import React from 'react';
import type { InstallStep } from '@/types';

/** Renders inline code styling within step text. */
const C = ({ children }: { children: string }) =>
  React.createElement('code', null, children);

export const installSteps: InstallStep[] = [
  {
    numeral: 'I.',
    content: 'Download the archive from the link below and extract it with WinRAR or 7-Zip.',
  },
  {
    numeral: 'II.',
    content: React.createElement(React.Fragment, null,
      'Locate your Napoleon Total War ', C({ children: 'data' }),
      ' folder — typically at ', C({ children: 'steamapps/common/Napoleon Total War/data' }),
    ),
  },
  {
    numeral: 'III.',
    content: React.createElement(React.Fragment, null,
      'If ', C({ children: 'DMN_40UnitsUI.pack' }),
      ' exists in your ', C({ children: 'data' }),
      ' folder, delete it. Newer versions of NERU include a custom UI mod that can comfortably display up to 60 units.',
    ),
  },
  {
    numeral: 'IV.',
    content: React.createElement(React.Fragment, null,
      'Place all extracted mod files into the ', C({ children: 'data' }),
      ' folder above. Overwrite existing files when prompted.',
    ),
  },
  {
    numeral: 'V.',
    content: React.createElement(React.Fragment, null,
      'Copy ', C({ children: 'user.script.txt' }),
      ' from the mod archive into ', C({ children: '%AppData%\\The Creative Assembly\\Napoleon\\scripts' }),
    ),
  },
  {
    numeral: 'VI.',
    content: React.createElement(React.Fragment, null,
      'In the same scripts folder, open ', C({ children: 'preferences.script.txt' }),
      ' with Notepad. Ensure ', C({ children: 'campaign_unit_multiplier' }),
      ' is set to ', C({ children: '1' }),
      ' — increasing this may cause infantry to lose the ability to form square. Ensure ', C({ children: 'gfx_unit_scale' }),
      ' is set to ', C({ children: '3' }),
      '. Save and set the file to read-only.',
    ),
  },
  {
    numeral: 'VII.',
    content: 'Launch via Steam. The mod loads automatically upon start.',
  },
];

export const installNote =
  'Requires Napoleon: Total War with all DLC. Back up your data folder first. Not compatible with other overhaul mods. Tip: type %AppData% in File Explorer to find the scripts folder. Do not change in-game graphics settings after editing preferences or it may reset your multiplier.';
