import {
  LIKE_CO_HOSTNAME,
  MEDIUM_REGEX,
} from '@/constant';

import EmbedCreateWidgetButton from '~/components/embed/EmbedCreateWidgetButton';
import EmbedUserInfo from '~/components/embed/EmbedUserInfo';
import SocialMediaConnect from '~/components/SocialMediaConnect';

import {
  apiPostLikeButton,
  apiGetUserMinById,
  apiGetSocialListById,
  apiQueryCoinGeckoInfo,
} from '~/util/api/api';

import { getAvatarHaloTypeFromUser } from '~/util/user';
import { handleQueryStringInUrl } from '~/util/url';

const MAX_LIKE = 5;

const debounce = require('lodash.debounce');

const debouncedOnClick = debounce((that) => {
  /* eslint-disable no-param-reassign */
  const count = that.likeCount - that.likeSent;
  that.likeSent += count;
  if (count > 0) apiPostLikeButton(that.id, that.referrer, count, that.hasCookieSupport);
  that.totalLike += count;
  /* eslint-enable no-param-reassign */
}, 500);

export default {
  components: {
    EmbedCreateWidgetButton,
    EmbedUserInfo,
    SocialMediaConnect,
  },
  asyncData({
    params,
    error,
    query,
  }) {
    let amount;
    try {
      const parse = parseInt(params.amount, 10);
      if (parse && !Number.isNaN(parse)) amount = parse;
    } catch (e) {
      // no op;
    }

    const { id } = params;
    let { type = '' } = query;
    const { referrer = '' } = query;
    if (!type && referrer.match(MEDIUM_REGEX)) {
      type = 'medium';
    }

    return Promise.all([
      apiGetUserMinById(id),
      apiGetSocialListById(id, type).catch(() => ({})),
      !amount && apiQueryCoinGeckoInfo()
        .then(res => res.data.market_data.current_price.usd)
        .catch(() => 0.0082625),
    ]).then((res) => {
      const {
        displayName,
        avatar,
        isPreRegCivicLiker,
        isSubscribedCivicLiker,
        civicLikerSince,
      } = res[0].data;

      let amountInUSD;
      if (!amount) {
        amountInUSD = 0.25;
        const USD_TO_LIKE = res[2];
        amount = (amountInUSD / USD_TO_LIKE).toFixed(2);
      }

      return {
        id,
        displayName,
        avatar,
        avatarHalo: getAvatarHaloTypeFromUser(res[0].data),
        isPreRegCivicLiker,
        isSubscribedCivicLiker,
        civicLikerSince,
        amount,
        amountInUSD,
        platforms: res[1].data,
      };
    }).catch((err) => {
      console.error(err); // eslint-disable-line no-console
      error({ statusCode: 404, message: '' });
    });
  },
  data() {
    return {
      like_count: 0,
      likeSent: 0,
      totalLike: 0,
      hasCookieSupport: false,
    };
  },
  computed: {
    getUserPath() {
      const amount = this.amount ? `/${this.amount}` : '';
      const referrer = this.urlReferrer ? `/?referrer=${encodeURIComponent(this.urlReferrer)}` : '';
      return `https://${LIKE_CO_HOSTNAME}/${this.id}${amount}${referrer}`;
    },
    urlReferrer() {
      const { query } = this.$route;
      let { referrer = '' } = query;
      referrer = handleQueryStringInUrl(referrer);
      return referrer;
    },
    getReferralLink() {
      const referrer = this.urlReferrer ? `/?referrer=${encodeURIComponent(this.urlReferrer)}` : '';
      return `https://${LIKE_CO_HOSTNAME}/ref/${this.id}${referrer}`;
    },
    likeCount: {
      get() {
        return this.like_count;
      },
      set(value) {
        this.like_count = Math.min(MAX_LIKE, value);
      },
    },
    isMaxLike() {
      return this.likeCount >= MAX_LIKE;
    },
  },
  methods: {
    like() {
      this.likeCount += 1;
      debouncedOnClick(this);
    },
  },
};
