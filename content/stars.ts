/*
 * stars.ts — a curated catalogue of bright, recognisable stars (J2000), enough
 * to render a real, legible Canberra sky: the Southern Cross, Centaurus, Orion,
 * Scorpius, and the brightest luminaries. RA in decimal hours, Dec in degrees,
 * mag = apparent magnitude (lower is brighter). Not exhaustive — chosen so the
 * shapes people know come through.
 */
export interface Star {
  ra: number; // hours
  dec: number; // degrees
  mag: number;
}

export const stars: Star[] = [
  { ra: 6.752, dec: -16.716, mag: -1.46 }, // Sirius
  { ra: 6.399, dec: -52.696, mag: -0.74 }, // Canopus
  { ra: 14.66, dec: -60.834, mag: -0.27 }, // Rigil Kentaurus (α Cen)
  { ra: 14.261, dec: 19.182, mag: -0.05 }, // Arcturus
  { ra: 18.616, dec: 38.784, mag: 0.03 }, // Vega
  { ra: 5.278, dec: 45.998, mag: 0.08 }, // Capella
  { ra: 5.242, dec: -8.202, mag: 0.13 }, // Rigel
  { ra: 7.655, dec: 5.225, mag: 0.34 }, // Procyon
  { ra: 1.629, dec: -57.237, mag: 0.46 }, // Achernar
  { ra: 5.919, dec: 7.407, mag: 0.5 }, // Betelgeuse
  { ra: 14.064, dec: -60.373, mag: 0.61 }, // Hadar (β Cen)
  { ra: 19.846, dec: 8.868, mag: 0.77 }, // Altair
  { ra: 12.443, dec: -63.099, mag: 0.77 }, // Acrux (α Cru)
  { ra: 4.599, dec: 16.509, mag: 0.85 }, // Aldebaran
  { ra: 16.49, dec: -26.432, mag: 0.96 }, // Antares
  { ra: 13.42, dec: -11.161, mag: 0.97 }, // Spica
  { ra: 7.755, dec: 28.026, mag: 1.14 }, // Pollux
  { ra: 22.961, dec: -29.622, mag: 1.16 }, // Fomalhaut
  { ra: 20.69, dec: 45.28, mag: 1.25 }, // Deneb
  { ra: 12.795, dec: -59.689, mag: 1.25 }, // Mimosa (β Cru)
  { ra: 10.139, dec: 11.967, mag: 1.35 }, // Regulus
  { ra: 6.977, dec: -28.972, mag: 1.5 }, // Adhara
  { ra: 7.577, dec: 31.888, mag: 1.58 }, // Castor
  { ra: 12.519, dec: -57.113, mag: 1.63 }, // Gacrux (γ Cru)
  { ra: 12.252, dec: -58.749, mag: 2.79 }, // Delta Crucis (completes the Cross)
  { ra: 17.56, dec: -37.104, mag: 1.62 }, // Shaula
  { ra: 5.418, dec: 6.35, mag: 1.64 }, // Bellatrix
  { ra: 5.604, dec: -1.202, mag: 1.69 }, // Alnilam (Orion's belt)
  { ra: 5.679, dec: -1.943, mag: 1.77 }, // Alnitak
  { ra: 5.533, dec: -0.299, mag: 2.23 }, // Mintaka
  { ra: 22.137, dec: -46.961, mag: 1.74 }, // Alnair
  { ra: 5.796, dec: -9.67, mag: 2.07 }, // Saiph
  { ra: 9.22, dec: -69.717, mag: 1.68 }, // Miaplacidus
  { ra: 8.375, dec: -59.51, mag: 1.86 }, // Avior
  { ra: 16.811, dec: -69.028, mag: 1.91 }, // Atria
  { ra: 9.46, dec: -8.659, mag: 1.98 }, // Alphard
  { ra: 18.921, dec: -26.297, mag: 2.05 }, // Nunki
  { ra: 14.111, dec: -36.37, mag: 2.06 }, // Menkent
  { ra: 20.427, dec: -56.735, mag: 1.94 }, // Peacock
  { ra: 7.14, dec: -26.393, mag: 1.83 }, // Wezen
  { ra: 17.622, dec: -42.998, mag: 1.86 }, // Sargas
  { ra: 16.005, dec: -22.622, mag: 2.29 }, // Dschubba (Scorpius head)
  { ra: 15.98, dec: -26.114, mag: 2.32 }, // Pi Scorpii
  { ra: 17.708, dec: -39.03, mag: 2.39 }, // Lesath
];
