# -*- coding: utf-8 -*-
# Generated by Django 1.11.7 on 2017-11-29 02:12
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pfxview', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='atbat',
            name='end_tfs_zulu',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
