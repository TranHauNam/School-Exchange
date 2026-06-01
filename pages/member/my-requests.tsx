import Head from 'next/head';
import { useCallback, useEffect, useState } from 'react';

import { RequestActions } from '@/components/admin/RequestActions';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { Tabs } from '@/components/common/Tabs';
import { useToast } from '@/components/common/Toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHead } from '@/components/layout/PageHead';
import { useAuth } from '@/lib/auth-context';
import { ApiError, mockApi } from '@/lib/services/mockApi';
import type { ProductRequest } from '@/lib/types/request';
import { useRequireRole } from '@/lib/withRoleGuard';
import { formatDate } from '@/lib/utils/formatDate';
import { requestStatusLabel, requestTypeLabel } from '@/lib/utils/post-labels';

type LoadStatus = 'loading' | 'ready' | 'error';
type RequestTab = 'sent' | 'received' | 'completed';

const REQUEST_TABS = [
  { id: 'sent', label: 'Đã gửi' },
  { id: 'received', label: 'Đã nhận' },
  { id: 'completed', label: 'Hoàn tất' },
] as const;

export default function MyRequestsPage() {
  const { session } = useAuth();
  const { show } = useToast();
  const { isLoading: guardLoading, isAuthorized } = useRequireRole(['member']);

  const [activeTab, setActiveTab] = useState<RequestTab>('sent');
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const [sentRequests, setSentRequests] = useState<ProductRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<ProductRequest[]>([]);
  const [completedRequests, setCompletedRequests] = useState<ProductRequest[]>([]);

  const loadRequests = useCallback(async () => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const [sent, received, completed] = await Promise.all([
        mockApi.requests.listSent(),
        mockApi.requests.listReceived(),
        mockApi.requests.listCompleted(),
      ]);

      setSentRequests(sent);
      setReceivedRequests(received);
      setCompletedRequests(completed);
      setStatus('ready');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Không thể tải danh sách yêu cầu.';
      setErrorMessage(message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void loadRequests();
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [isAuthorized, loadRequests]);

  const handleAccept = async (requestId: string) => {
    try {
      await mockApi.requests.acceptRequest(requestId);
      show('Đã chấp nhận yêu cầu.', 'success');
      await loadRequests();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Không thể chấp nhận yêu cầu.';
      show(message, 'error');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await mockApi.requests.rejectRequest(requestId);
      show('Đã từ chối yêu cầu.', 'success');
      await loadRequests();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Không thể từ chối yêu cầu.';
      show(message, 'error');
    }
  };

  const handleComplete = async (requestId: string) => {
    try {
      await mockApi.requests.completeRequest(requestId);
      show('Đã hoàn tất giao dịch.', 'success');
      await loadRequests();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Không thể hoàn tất yêu cầu.';
      show(message, 'error');
    }
  };

  if (guardLoading || !isAuthorized) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Yêu cầu của tôi · School Item Exchange</title>
      </Head>

      <DashboardLayout eyebrow="Cổng trường học" title="Yêu cầu của tôi">
        <PageHead
          title="Yêu cầu & Giao dịch"
          description="Theo dõi yêu cầu gửi đi, yêu cầu đến và giao dịch đã hoàn tất."
        />

        {status === 'loading' ? <LoadingState message="Đang tải yêu cầu..." /> : null}

        {status === 'error' ? (
          <ErrorState
            message={errorMessage || 'Không thể tải danh sách yêu cầu.'}
            onRetry={() => {
              void loadRequests();
            }}
          />
        ) : null}

        {status === 'ready' ? (
          <section className="card">
            <Tabs
              tabs={REQUEST_TABS.map((tab) => ({ id: tab.id, label: tab.label }))}
              active={activeTab}
              onChange={(tabId) => setActiveTab(tabId as RequestTab)}
            />

            <div id="sent" className="tab-panel" hidden={activeTab !== 'sent'}>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Bài đăng</th>
                      <th>Người nhận</th>
                      <th>Loại yêu cầu</th>
                      <th>Trạng thái</th>
                      <th>Ngày gửi</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sentRequests.length === 0 ? (
                      <tr>
                        <td colSpan={6}>
                          <EmptyState message="Bạn chưa gửi yêu cầu nào." />
                        </td>
                      </tr>
                    ) : (
                      sentRequests.map((request) => (
                        <tr key={request.id}>
                          <td>
                            <strong>{request.product}</strong>
                          </td>
                          <td>{request.receiver}</td>
                          <td>{requestTypeLabel(request.type)}</td>
                          <td>
                            <Badge status={request.status} label={requestStatusLabel(request.status)} />
                          </td>
                          <td>{formatDate(request.date)}</td>
                          <td>—</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div id="received" className="tab-panel" hidden={activeTab !== 'received'}>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Bài đăng</th>
                      <th>Người gửi</th>
                      <th>Loại yêu cầu</th>
                      <th>Trạng thái</th>
                      <th>Ngày gửi</th>
                      <th>Phản hồi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receivedRequests.length === 0 ? (
                      <tr>
                        <td colSpan={6}>
                          <EmptyState message="Chưa có yêu cầu đến." />
                        </td>
                      </tr>
                    ) : (
                      receivedRequests.map((request) => (
                        <tr key={request.id}>
                          <td>
                            <strong>{request.product}</strong>
                          </td>
                          <td>{request.sender}</td>
                          <td>{requestTypeLabel(request.type)}</td>
                          <td>
                            <Badge status={request.status} label={requestStatusLabel(request.status)} />
                          </td>
                          <td>{formatDate(request.date)}</td>
                          <td>
                            <RequestActions
                              request={request}
                              onAccept={() => handleAccept(request.id)}
                              onReject={() => handleReject(request.id)}
                              onComplete={() => handleComplete(request.id)}
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div id="completed" className="tab-panel" hidden={activeTab !== 'completed'}>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Bài đăng</th>
                      <th>Đối tác</th>
                      <th>Loại yêu cầu</th>
                      <th>Trạng thái</th>
                      <th>Ngày</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedRequests.length === 0 ? (
                      <tr>
                        <td colSpan={6}>
                          <EmptyState message="Chưa có giao dịch hoàn tất." />
                        </td>
                      </tr>
                    ) : (
                      completedRequests.map((request) => (
                        <tr key={request.id}>
                          <td>
                            <strong>{request.product}</strong>
                          </td>
                          <td>{request.sender === session?.userName ? request.receiver : request.sender}</td>
                          <td>{requestTypeLabel(request.type)}</td>
                          <td>
                            <Badge status={request.status} label={requestStatusLabel(request.status)} />
                          </td>
                          <td>{formatDate(request.date)}</td>
                          <td>—</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ) : null}
      </DashboardLayout>
    </>
  );
}
