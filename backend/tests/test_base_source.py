import itertools

import pytest

from marex.signals import Signal, SignalType
from marex.sources.base import DataSource


def test_datasource_cannot_be_instantiated_directly():
    with pytest.raises(TypeError):
        DataSource()


def test_concrete_subclass_streams_signals():
    class Fake(DataSource):
        def stream(self):
            while True:
                yield [Signal.create(SignalType.DEPTH, 10.0)]

    ticks = list(itertools.islice(Fake().stream(), 2))
    assert len(ticks) == 2
    assert ticks[0][0].type is SignalType.DEPTH
