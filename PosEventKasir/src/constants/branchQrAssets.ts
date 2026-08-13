// Mapping static image assets for 33 store branch QR codes in Indonesia

const BRANCH_QR_MAP: Record<string, any> = {
  // Let's Go Gelato Branches
  'gelato-bandung-bengawan': require('../../assets/qr_codes/gelato-bandung-bengawan.png'),
  'gelato-bandung-braga': require('../../assets/qr_codes/gelato-bandung-braga.png'),
  'gelato-bandung-ciumbuleuit': require('../../assets/qr_codes/gelato-bandung-ciumbuleuit.png'),
  'gelato-bandung-pvj': require('../../assets/qr_codes/gelato-bandung-pvj.png'),
  'gelato-bandung-summarecon': require('../../assets/qr_codes/gelato-bandung-summarecon.png'),

  'gelato-jakarta-cibubur': require('../../assets/qr_codes/gelato-jakarta-cibubur.png'),
  'gelato-jakarta-gandaria': require('../../assets/qr_codes/gelato-jakarta-gandaria.png'),
  'gelato-jakarta-gading': require('../../assets/qr_codes/gelato-jakarta-gading.png'),
  'gelato-jakarta-centralpark': require('../../assets/qr_codes/gelato-jakarta-centralpark.png'),

  'gelato-bekasi-summarecon': require('../../assets/qr_codes/gelato-bekasi-summarecon.png'),
  'gelato-bekasi-grandmet': require('../../assets/qr_codes/gelato-bekasi-grandmet.png'),

  'gelato-bogor-cibinong': require('../../assets/qr_codes/gelato-bogor-cibinong.png'),
  'gelato-bogor-botani': require('../../assets/qr_codes/gelato-bogor-botani.png'),

  'gelato-depok-margocity': require('../../assets/qr_codes/gelato-depok-margocity.png'),

  'gelato-tangerang-karawaci': require('../../assets/qr_codes/gelato-tangerang-karawaci.png'),
  'gelato-tangerang-bintaro': require('../../assets/qr_codes/gelato-tangerang-bintaro.png'),

  'gelato-jogja-malioboro': require('../../assets/qr_codes/gelato-jogja-malioboro.png'),
  'gelato-jogja-pakuwon': require('../../assets/qr_codes/gelato-jogja-pakuwon.png'),

  'gelato-semarang-simpanglima': require('../../assets/qr_codes/gelato-semarang-simpanglima.png'),
  'gelato-solo-paragon': require('../../assets/qr_codes/gelato-solo-paragon.png'),

  'gelato-surabaya-tunjungan': require('../../assets/qr_codes/gelato-surabaya-tunjungan.png'),
  'gelato-surabaya-pakuwon': require('../../assets/qr_codes/gelato-surabaya-pakuwon.png'),

  'gelato-malang-matos': require('../../assets/qr_codes/gelato-malang-matos.png'),

  'gelato-bali-seminyak': require('../../assets/qr_codes/gelato-bali-seminyak.png'),
  'gelato-bali-canggu': require('../../assets/qr_codes/gelato-bali-canggu.png'),
  'gelato-bali-beachwalk': require('../../assets/qr_codes/gelato-bali-beachwalk.png'),

  'gelato-medan-sunplaza': require('../../assets/qr_codes/gelato-medan-sunplaza.png'),
  'gelato-palembang-pim': require('../../assets/qr_codes/gelato-palembang-pim.png'),
  'gelato-makassar-tsm': require('../../assets/qr_codes/gelato-makassar-tsm.png'),
  'gelato-balikpapan-pentacity': require('../../assets/qr_codes/gelato-balikpapan-pentacity.png'),

  // Terve Chocolate Branches
  'terve-bandung-bengawan': require('../../assets/qr_codes/terve-bandung-bengawan.png'),
  'terve-bandung-braga': require('../../assets/qr_codes/terve-bandung-braga.png'),
  'terve-padalarang-kbp': require('../../assets/qr_codes/terve-padalarang-kbp.png'),
};

import { extractCleanBranchName, generateShortOrderUrl } from '../utils/branchHelper';

export const getBranchQrDetails = (cabangName: string = '') => {
  const cleanName = extractCleanBranchName(cabangName);
  const lower = cleanName.toLowerCase();
  let key = 'gelato-bandung-bengawan';

  if (lower.includes('terve')) {
    if (lower.includes('braga')) {
      key = 'terve-bandung-braga';
    } else if (lower.includes('kbp') || lower.includes('padalarang')) {
      key = 'terve-padalarang-kbp';
    } else {
      key = 'terve-bandung-bengawan';
    }
  } else {
    if (lower.includes('braga')) {
      key = 'gelato-bandung-braga';
    } else if (lower.includes('ciumbuleuit')) {
      key = 'gelato-bandung-ciumbuleuit';
    } else if (lower.includes('pvj')) {
      key = 'gelato-bandung-pvj';
    } else if (lower.includes('cibubur')) {
      key = 'gelato-jakarta-cibubur';
    } else if (lower.includes('gandaria')) {
      key = 'gelato-jakarta-gandaria';
    } else if (lower.includes('gading')) {
      key = 'gelato-jakarta-gading';
    } else if (lower.includes('centralpark')) {
      key = 'gelato-jakarta-centralpark';
    } else if (lower.includes('bekasi')) {
      key = 'gelato-bekasi-summarecon';
    } else if (lower.includes('bogor') || lower.includes('cibinong')) {
      key = 'gelato-bogor-cibinong';
    } else if (lower.includes('depok') || lower.includes('margocity')) {
      key = 'gelato-depok-margocity';
    } else if (lower.includes('tangerang') || lower.includes('karawaci')) {
      key = 'gelato-tangerang-karawaci';
    } else if (lower.includes('jogja') || lower.includes('malioboro')) {
      key = 'gelato-jogja-malioboro';
    } else if (lower.includes('semarang')) {
      key = 'gelato-semarang-simpanglima';
    } else if (lower.includes('solo')) {
      key = 'gelato-solo-paragon';
    } else if (lower.includes('surabaya')) {
      key = 'gelato-surabaya-tunjungan';
    } else if (lower.includes('malang')) {
      key = 'gelato-malang-matos';
    } else if (lower.includes('bali') || lower.includes('seminyak')) {
      key = 'gelato-bali-seminyak';
    } else if (lower.includes('medan')) {
      key = 'gelato-medan-sunplaza';
    } else if (lower.includes('palembang')) {
      key = 'gelato-palembang-pim';
    } else if (lower.includes('makassar')) {
      key = 'gelato-makassar-tsm';
    } else if (lower.includes('balikpapan')) {
      key = 'gelato-balikpapan-pentacity';
    } else {
      key = 'gelato-bandung-bengawan';
    }
  }

  const url = generateShortOrderUrl(cleanName);
  const imageSource = BRANCH_QR_MAP[key] || BRANCH_QR_MAP['gelato-bandung-bengawan'];
  return { key, imageSource, url, cleanName };
};
