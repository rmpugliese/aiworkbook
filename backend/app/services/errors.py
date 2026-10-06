class NotFoundError(LookupError):
    """The requested resource does not exist (or not where it was looked up)."""


class ConflictError(Exception):
    """The request is valid but conflicts with the current state of the resource."""


class InvalidRequestError(ValueError):
    """The request content fails a business rule."""
