/**
 * Raw shape returned by the Osclass REST plugin for an item.
 * The Osclass core uses Hungarian-style prefixes (s_ string, i_ int, b_ bool, dt_ date, fk_ foreign key).
 *
 * Different REST plugin builds return slightly different field sets. We model
 * the common subset and treat everything else as optional.
 */
export type OsclassResource = {
  pk_i_id?: number | string;
  s_name?: string;
  s_extension?: string;
  s_path?: string;
  url?: string;
  url_thumbnail?: string;
};

export type OsclassItem = {
  pk_i_id: number | string;
  fk_i_user_id?: number | string | null;
  fk_i_category_id?: number | string;
  dt_pub_date?: string;
  s_title?: string;
  s_description?: string;
  i_price?: number | string | null;
  s_currency?: string | null;
  s_city?: string | null;
  s_region?: string | null;
  s_country?: string | null;
  s_address?: string | null;
  b_active?: number | boolean;
  b_enabled?: number | boolean;
  b_show_email?: number | boolean;
  s_contact_name?: string | null;
  s_contact_email?: string | null;
  resources?: OsclassResource[];
  meta?: Array<{ s_name?: string; s_value?: string }>;
};

/**
 * Wrapper shape the plugin uses for list responses. It varies between forks,
 * so we accept either an array or an object with `data`/`response`.
 */
export type OsclassListResponse<T> =
  | T[]
  | {
      data?: T[];
      response?: T[];
      total?: number;
      page?: number;
    };

/**
 * Location reference data returned by the OsclassPoint REST plugin.
 * Field names follow Osclass core's Hungarian prefixes.
 *
 * Verified shapes from admin.listrex.com (Osclass 8.3.1):
 *
 *   region:   { pk_i_id, fk_c_country_code, s_name, s_name_native,
 *               b_active, s_slug }
 *   country:  { pk_c_code, s_name, s_name_native, s_phone_code,
 *               s_currency, s_slug }
 *   city:     { pk_i_id, fk_i_region_id, s_name, s_name_native,
 *               fk_c_country_code, b_active, s_slug,
 *               d_coord_lat, d_coord_long }
 *   currency: { pk_c_code, s_name, s_description, b_enabled }
 */
export type OsclassRegion = {
  pk_i_id: number | string;
  fk_c_country_code?: string;
  s_name?: string;
  s_name_native?: string | null;
  b_active?: number | string | boolean;
  s_slug?: string;
};

export type OsclassCountry = {
  pk_c_code: string;
  s_name?: string;
  s_name_native?: string | null;
  s_phone_code?: string;
  s_currency?: string;
  s_slug?: string;
};

export type OsclassCity = {
  pk_i_id: number | string;
  fk_i_region_id?: number | string;
  fk_c_country_code?: string;
  s_name?: string;
  s_name_native?: string | null;
  b_active?: number | string | boolean;
  s_slug?: string;
  d_coord_lat?: number | string | null;
  d_coord_long?: number | string | null;
};

export type OsclassCurrency = {
  pk_c_code: string;
  s_name?: string;
  s_description?: string;
  b_enabled?: number | string | boolean;
};

export type OsclassCategory = {
  pk_i_id: number | string;
  fk_i_parent_id?: number | string | null;
  i_position?: number | string;
  b_enabled?: number | string | boolean;
  fk_i_category_id?: number | string;
  fk_c_locale_code?: string;
  s_name?: string;
  s_description?: string | null;
  s_slug?: string;
  i_num_items?: number | string;
  categories?: OsclassCategory[];
};
