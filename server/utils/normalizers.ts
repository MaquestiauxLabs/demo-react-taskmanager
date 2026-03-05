type LabelLike = Record<string, unknown>;
type CommentLike = Record<string, unknown>;
type UserLike = Record<string, unknown>;

type WithLabelLinks = Record<string, unknown> & {
  labelLinks?: Array<{
    label?: LabelLike | null;
  }>;
};

type WithCommentLinks = Record<string, unknown> & {
  commentLinks?: Array<{
    comment?: CommentLike | null;
  }>;
};

type WithWatcherLinks = Record<string, unknown> & {
  watchers?: Array<{
    user?: UserLike | null;
  }>;
};

export const normalizeWithLabels = <T extends WithLabelLinks>(entity: T) => {
  const labels = Array.isArray(entity.labelLinks)
    ? entity.labelLinks
        .map((link) => link?.label)
        .filter((label): label is LabelLike => Boolean(label))
    : [];

  const { labelLinks: _labelLinks, ...rest } = entity;

  return {
    ...rest,
    labels,
  };
};

export const normalizeManyWithLabels = <T extends WithLabelLinks>(
  entities: T[],
) => entities.map((entity) => normalizeWithLabels(entity));

export const normalizeWithLabelsAndComments = <
  T extends WithLabelLinks & WithCommentLinks,
>(
  entity: T,
) => {
  const normalizedLabels = normalizeWithLabels(entity);

  const comments = Array.isArray(entity.commentLinks)
    ? entity.commentLinks
        .map((link) => link?.comment)
        .filter((comment): comment is CommentLike => Boolean(comment))
    : [];

  const { commentLinks: _commentLinks, ...rest } = normalizedLabels;

  return {
    ...rest,
    comments,
  };
};

export const normalizeManyWithLabelsAndComments = <
  T extends WithLabelLinks & WithCommentLinks,
>(
  entities: T[],
) => entities.map((entity) => normalizeWithLabelsAndComments(entity));

export const normalizeTaskWithDetails = <
  T extends WithLabelLinks & WithCommentLinks & WithWatcherLinks,
>(
  entity: T,
) => {
  const normalizedEntity = normalizeWithLabelsAndComments(entity);

  const watcherUsers = Array.isArray(entity.watchers)
    ? entity.watchers
        .map((link) => link?.user)
        .filter((user): user is UserLike => Boolean(user))
    : [];

  const { watchers: _watchers, ...rest } = normalizedEntity;

  return {
    ...rest,
    watchers: watcherUsers,
    watcherCount: watcherUsers.length,
  };
};

export const normalizeManyTasksWithDetails = <
  T extends WithLabelLinks & WithCommentLinks & WithWatcherLinks,
>(
  entities: T[],
) => entities.map((entity) => normalizeTaskWithDetails(entity));
