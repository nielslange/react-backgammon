/**
 * Internal dependencies
 */
import type { NoticeType } from '../types';
import { MessageType, NoticeStatusType } from '../types';

export const createNotice = (
	status: NoticeStatusType,
	message: MessageType
): NoticeType => ( {
	status,
	message,
} );
