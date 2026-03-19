"""
Unit tests for models.py (Pydantic model validation)

Self-contained — no MongoDB or Redis required.
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from datetime import datetime
from pydantic import ValidationError
from bson import ObjectId

from models import Price, Trade, User


class TestPriceModel:
    def test_valid_price_model(self):
        price = Price(
            symbol="BTCUSDT",
            price=50000.0,
            timestamp=datetime.utcnow(),
        )
        assert price.symbol == "BTCUSDT"
        assert price.price == 50000.0

    def test_price_requires_symbol(self):
        with pytest.raises(ValidationError):
            Price(price=50000.0, timestamp=datetime.utcnow())

    def test_price_requires_timestamp(self):
        with pytest.raises(ValidationError):
            Price(symbol="BTCUSDT", price=50000.0)

    def test_price_requires_numeric_price(self):
        with pytest.raises((ValidationError, ValueError)):
            Price(symbol="BTCUSDT", price="not-a-number", timestamp=datetime.utcnow())


class TestTradeModel:
    def _valid_trade_data(self):
        return dict(
            user=ObjectId(),
            symbol="BTCUSDT",
            type="BUY",
            price=50000.0,
            amount=0.01,
            total=500.0,
        )

    def test_valid_buy_trade(self):
        trade = Trade(**self._valid_trade_data())
        assert trade.type == "BUY"
        assert trade.symbol == "BTCUSDT"

    def test_valid_sell_trade(self):
        data = self._valid_trade_data()
        data["type"] = "SELL"
        trade = Trade(**data)
        assert trade.type == "SELL"

    def test_trade_requires_symbol(self):
        data = self._valid_trade_data()
        del data["symbol"]
        with pytest.raises(ValidationError):
            Trade(**data)

    def test_trade_requires_price(self):
        data = self._valid_trade_data()
        del data["price"]
        with pytest.raises(ValidationError):
            Trade(**data)

    def test_trade_timestamp_defaults_to_now(self):
        before = datetime.utcnow()
        trade = Trade(**self._valid_trade_data())
        after = datetime.utcnow()
        assert before <= trade.timestamp <= after

    def test_trade_total_stored_correctly(self):
        data = self._valid_trade_data()
        data["total"] = 999.99
        trade = Trade(**data)
        assert trade.total == 999.99


class TestUserModel:
    def test_valid_user(self):
        user = User(username="alice", password="hashed_pw")
        assert user.username == "alice"

    def test_user_requires_username(self):
        with pytest.raises(ValidationError):
            User(password="hashed_pw")

    def test_user_requires_password(self):
        with pytest.raises(ValidationError):
            User(username="alice")
