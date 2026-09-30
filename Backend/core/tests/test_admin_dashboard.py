from decimal import Decimal
from unittest.mock import Mock

from django.test import RequestFactory, TestCase
from django.template.loader import render_to_string

from apps.donations.models import Donation
from core.admin_dashboard import dashboard_callback


class AdminDashboardTests(TestCase):
    def request(self, allowed=True):
        request = RequestFactory().get('/admin/')
        request.user = Mock()
        request.user.has_perms.return_value = allowed
        return request

    def test_restricted_staff_do_not_query_or_receive_dashboard_data(self):
        with self.assertNumQueries(0):
            context = dashboard_callback(self.request(False), {})
        self.assertEqual(context, {'dashboard_available': False})

    def test_completed_totals_stay_separate_by_currency(self):
        Donation.objects.create(amount=Decimal('10'), currency='USD', status='completed')
        Donation.objects.create(amount=Decimal('5000'), currency='XAF', status='completed')
        Donation.objects.create(amount=Decimal('99'), currency='USD', status='pending')
        context = dashboard_callback(self.request(), {})
        money = context['dashboard_kpis'][:2]
        self.assertEqual([row['value'] for row in money], ['$10.00', 'FCFA 5,000.00'])
        import json
        chart = json.loads(context['donation_chart'])
        self.assertEqual(sum(chart['datasets'][0]['data']), 2)
        html = render_to_string('admin/index.html', context, request=self.request())
        self.assertIn('FCFA 5,000.00', html)
        self.assertIn('Completed donation count', html)

    def test_empty_dashboard_renders(self):
        context = dashboard_callback(self.request(), {})
        html = render_to_string('admin/index.html', context, request=self.request())
        self.assertIn('No donations yet.', html)
