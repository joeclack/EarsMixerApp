# EarsMixer app design system

## Colour and appearance

Use the semantic tokens in [src/theme.ts](src/theme.ts), including the saved appearance preference and system appearance. The table records the main roles. Update the table with the theme when changing these values.

| Role | Dark | Light |
| --- | --- | --- |
| Background | `#0B1015` | `#E8EFF3` |
| Panel | `#182129` | `#FFFFFF` |
| Text | `#F5F5F7` | `#152B35` |
| Muted text | `#98989F` | `#475D69` |
| Active tint | `#48D8C4` | `#007D71` |
| Destructive | `#FF453A` | `#D70015` |

Keep labels, icons or accessibility states with colour cues for selection, mute and connection status. Reuse the desk and group tokens for the mixer surfaces.

## Type, controls and layout

- Use the existing platform typography. Keep channel names, values and controls readable when text grows. Write plain British English in sentence case and preserve established desk terms.
- Use the native navigation, settings controls and materials where available. Reuse existing platform variants in [src/components](src/components) and preserve Android and web fallbacks. Let native surfaces supply their own glass.
- Keep portrait faders and the landscape bank consistent in labelling, mute state, level and pan. Use the existing fader artwork and geometry. Make the selected AUX and connection state easy to find. Keep related controls reachable around safe areas.
- Verify both appearances, rotation, larger text and screen-reader labels on affected platforms. Check reduced motion and transparency when changing animations or materials.
