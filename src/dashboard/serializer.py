# -*- coding: utf-8 -*-

from rest_framework import serializers
from . import models


class UserExtremeAlertSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True,
                                              default=serializers.CurrentUserDefault())
    class Meta:
        model = models.UserExtremeAlert
        fields = ('id', 'user', 'category', 'rate', 'high', 'low')


class UserQuoteSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True,
                                              default=serializers.CurrentUserDefault())
    class Meta:
        model = models.UserQuote
        fields = ('id', 'user', 'symbol')