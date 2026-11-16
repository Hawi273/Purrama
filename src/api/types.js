// JSDoc types for the parts of TMDB responses Purrama uses.
// Only fields read by the app are listed; TMDB sends more.

/** @typedef {'movie' | 'tv'} MediaType */
/** @typedef {'movie' | 'tv' | 'person'} AnyMediaType */

/**
 * @template T
 * @typedef {{ page: number, results: T[], total_pages: number, total_results: number }} Paged
 */

/** @typedef {{ id: number, name: string }} Genre */

/**
 * A movie or TV show as it appears in lists and search results.
 * @typedef {object} TitleSummary
 * @property {number} id
 * @property {MediaType} [media_type]
 * @property {string} [title]           movies
 * @property {string} [name]            TV
 * @property {string} [original_title]
 * @property {string} [original_name]
 * @property {string} [release_date]    movies, YYYY-MM-DD
 * @property {string} [first_air_date]  TV, YYYY-MM-DD
 * @property {string | null} [poster_path]
 * @property {string | null} [backdrop_path]
 * @property {string} [overview]
 * @property {number} [vote_average]
 * @property {number} [vote_count]
 * @property {number[]} [genre_ids]
 * @property {number} [popularity]
 */

/**
 * @typedef {object} PersonSummary
 * @property {number} id
 * @property {'person'} [media_type]
 * @property {string} name
 * @property {string | null} [profile_path]
 * @property {string} [known_for_department]
 * @property {TitleSummary[]} [known_for]
 * @property {number} [popularity]
 */

/** @typedef {(TitleSummary & { media_type: MediaType }) | (PersonSummary & { media_type: 'person' })} MultiResult */

/**
 * @typedef {object} CastCredit
 * @property {number} id
 * @property {string} name
 * @property {string | null} [profile_path]
 * @property {string} [character]
 * @property {{ character: string, episode_count: number }[]} [roles]   aggregate_credits (TV)
 * @property {number} [total_episode_count]
 * @property {number} [order]
 */

/**
 * @typedef {object} CrewCredit
 * @property {number} id
 * @property {string} name
 * @property {string | null} [profile_path]
 * @property {string} [job]
 * @property {{ job: string, episode_count: number }[]} [jobs]           aggregate_credits (TV)
 * @property {string} department
 */

/** @typedef {{ cast: CastCredit[], crew: CrewCredit[] }} Credits */

/**
 * @typedef {object} Video
 * @property {string} key
 * @property {string} name
 * @property {string} site
 * @property {string} type
 * @property {boolean} [official]
 * @property {string} [published_at]
 */

/** @typedef {{ file_path: string, aspect_ratio: number, width: number, height: number, iso_639_1?: string | null }} ImageInfo */
/** @typedef {{ backdrops: ImageInfo[], posters: ImageInfo[], logos?: ImageInfo[] }} Images */
/** @typedef {{ id: number, name: string, logo_path?: string | null, origin_country?: string }} Company */

/**
 * @typedef {object} MovieDetails
 * @property {number} id
 * @property {string} title
 * @property {string} original_title
 * @property {string} [original_language]
 * @property {string} [tagline]
 * @property {string} [overview]
 * @property {string} [release_date]
 * @property {number | null} [runtime]
 * @property {Genre[]} genres
 * @property {number} [vote_average]
 * @property {number} [vote_count]
 * @property {string | null} [poster_path]
 * @property {string | null} [backdrop_path]
 * @property {number} [budget]
 * @property {number} [revenue]
 * @property {string} [status]
 * @property {string | null} [homepage]
 * @property {Company[]} [production_companies]
 * @property {{ iso_3166_1: string, name: string }[]} [production_countries]
 * @property {{ english_name: string, iso_639_1: string }[]} [spoken_languages]
 * @property {{ id: number, name: string, poster_path?: string | null, backdrop_path?: string | null } | null} [belongs_to_collection]
 * @property {Credits} [credits]
 * @property {{ results: Video[] }} [videos]
 * @property {Images} [images]
 * @property {Paged<TitleSummary>} [similar]
 * @property {Paged<TitleSummary>} [recommendations]
 * @property {{ results: { iso_3166_1: string, release_dates: { certification: string, type: number }[] }[] }} [release_dates]
 */

/**
 * @typedef {object} SeasonSummary
 * @property {number} id
 * @property {string} name
 * @property {number} season_number
 * @property {number} [episode_count]
 * @property {string | null} [air_date]
 * @property {string | null} [poster_path]
 * @property {string} [overview]
 */

/**
 * @typedef {object} TvDetails
 * @property {number} id
 * @property {string} name
 * @property {string} original_name
 * @property {string} [original_language]
 * @property {string} [tagline]
 * @property {string} [overview]
 * @property {string} [first_air_date]
 * @property {string} [last_air_date]
 * @property {number[]} [episode_run_time]
 * @property {number} [number_of_seasons]
 * @property {number} [number_of_episodes]
 * @property {string} [status]
 * @property {boolean} [in_production]
 * @property {Genre[]} genres
 * @property {number} [vote_average]
 * @property {number} [vote_count]
 * @property {string | null} [poster_path]
 * @property {string | null} [backdrop_path]
 * @property {{ id: number, name: string, profile_path?: string | null }[]} [created_by]
 * @property {Company[]} [networks]
 * @property {Company[]} [production_companies]
 * @property {{ iso_3166_1: string, name: string }[]} [production_countries]
 * @property {SeasonSummary[]} [seasons]
 * @property {Credits} [aggregate_credits]
 * @property {{ results: Video[] }} [videos]
 * @property {Images} [images]
 * @property {Paged<TitleSummary>} [similar]
 * @property {Paged<TitleSummary>} [recommendations]
 * @property {{ results: { iso_3166_1: string, rating: string }[] }} [content_ratings]
 */

/**
 * @typedef {object} Episode
 * @property {number} id
 * @property {string} name
 * @property {number} episode_number
 * @property {number} season_number
 * @property {string | null} [air_date]
 * @property {string} [overview]
 * @property {number | null} [runtime]
 * @property {string | null} [still_path]
 * @property {number} [vote_average]
 * @property {number} [vote_count]
 * @property {CrewCredit[]} [crew]
 * @property {CastCredit[]} [guest_stars]
 */

/**
 * @typedef {object} SeasonDetails
 * @property {number} id
 * @property {string} name
 * @property {number} season_number
 * @property {string} [overview]
 * @property {string | null} [air_date]
 * @property {string | null} [poster_path]
 * @property {Episode[]} episodes
 */

/**
 * @typedef {object} PersonCredit
 * @property {number} id
 * @property {MediaType} media_type
 * @property {string} [title]
 * @property {string} [name]
 * @property {string} [release_date]
 * @property {string} [first_air_date]
 * @property {string | null} [poster_path]
 * @property {string} [character]
 * @property {string} [job]
 * @property {string} [department]
 * @property {number} [vote_count]
 * @property {number} [vote_average]
 * @property {number} [popularity]
 * @property {number} [episode_count]
 */

/**
 * @typedef {object} PersonDetails
 * @property {number} id
 * @property {string} name
 * @property {string} [biography]
 * @property {string | null} [birthday]
 * @property {string | null} [deathday]
 * @property {string | null} [place_of_birth]
 * @property {string} [known_for_department]
 * @property {string | null} [profile_path]
 * @property {string[]} [also_known_as]
 * @property {string | null} [homepage]
 * @property {{ cast: PersonCredit[], crew: PersonCredit[] }} [combined_credits]
 * @property {{ profiles: ImageInfo[] }} [images]
 */

/**
 * @typedef {object} Collection
 * @property {number} id
 * @property {string} name
 * @property {string} [overview]
 * @property {string | null} [poster_path]
 * @property {string | null} [backdrop_path]
 * @property {TitleSummary[]} parts
 */

export {};
