/**
 * Internal dependencies
 */
import { MessageType, NoticeStatusType } from '.';

export type NoticeType = {
	message: MessageType;
	status: NoticeStatusType;
};
