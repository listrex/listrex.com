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
 * so we accept either an array or an object with `data`.
 */
export type OsclassListResponse<T> =
  | T[]
  | {
      data?: T[];
      total?: number;
      page?: number;
    };
