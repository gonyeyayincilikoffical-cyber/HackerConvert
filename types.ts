export type Language = 'tr' | 'en' | 'fr' | 'ar';

export type AppTheme = 'matrix' | 'synthwave' | 'cyberpunk' | 'glacier';

export interface FileQueueItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'idle' | 'converting' | 'success' | 'error';
  targetFormat: string;
  error?: string;
  downloadUrl?: string;
  convertedName?: string;
  previewUrl?: string;
}

export interface TerminalLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warn';
  message: string;
}

export interface TranslationDict {
  title: string;
  hero_title_left: string;
  hero_title_highlight: string;
  hero_title_right: string;
  nav_converter: string;
  nav_formats: string;
  nav_how: string;
  btn_login: string;
  btn_logout: string;
  btn_start: string;
  hero_eyebrow: string;
  hero_lead: string;
  stat_cats_val: string;
  stat_cats_lbl: string;
  stat_formats_val: string;
  stat_formats_lbl: string;
  stat_server_val: string;
  stat_server_lbl: string;
  widget_title: string;
  dropzone_title: string;
  dropzone_bold: string;
  dropzone_sub: string;
  target_format_lbl: string;
  select_first: string;
  btn_convert: string;
  btn_convert_all: string;
  progress_loading: string;
  result_ready: string;
  btn_download: string;
  disclaimer_text: string;
  cat_eyebrow: string;
  cat_title: string;
  cat_desc: string;
  badge_live: string;
  badge_soon: string;
  cat_img_t: string;
  cat_img_d: string;
  cat_pdf_t: string;
  cat_pdf_d: string;
  cat_data_t: string;
  cat_data_d: string;
  cat_aud_t: string;
  cat_aud_d: string;
  cat_book_t: string;
  cat_book_d: string;
  cat_zip_t: string;
  cat_zip_d: string;
  how_title: string;
  step1_t: string;
  step1_d: string;
  step2_t: string;
  step2_d: string;
  step3_t: string;
  step3_d: string;
  cta_title: string;
  cta_desc: string;
  btn_start_now: string;
  foot_desc: string;
  foot_h_prod: string;
  foot_h_sec: string;
  foot_privacy: string;
  foot_terms: string;
  foot_author: string;
  modal_title: string;
  lbl_name: string;
  lbl_nick: string;
  placeholder_name: string;
  placeholder_nick: string;
  lbl_remember: string;
  btn_login_submit: string;
  
  // Design Addition Additions:
  terminal_header: string;
  terminal_placeholder: string;
  theme_selector_lbl: string;
  preview_panel_title: string;
  preview_no_file: string;
  audio_effects_lbl: string;
  clear_queue_btn: string;
}
